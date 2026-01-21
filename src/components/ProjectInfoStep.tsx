import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Camera, X, ArrowRight } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { getDefaultProjectName, correctImageOrientation } from '@/lib/utils';

const projectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  areaM2: z.number().min(30, 'Min 30 m²').max(5000, 'Max 5000 m²'),
  workstations: z.number().min(1, 'Min 1 poste').max(400, 'Max 400 postes'),
  styleLevel: z.enum(['basic', 'standard', 'premium']),
  meetingTablesPreference: z.boolean(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export const ProjectInfoStep = () => {
  const { createProject, updateProject, setPhoto, setStep, currentProject } = useProjectStore();
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentProject?.photoUrl || null);
  const [photoFile, setPhotoFile] = useState<File | null>(currentProject?.photoFile || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: currentProject?.name || getDefaultProjectName(),
      areaM2: currentProject?.areaM2 || 100,
      workstations: currentProject?.workstations || 10,
      styleLevel: currentProject?.styleLevel || 'standard',
      meetingTablesPreference: currentProject?.meetingTablesPreference || false,
    },
  });

  const meetingTablesPreference = watch('meetingTablesPreference');

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 10 MB');
      return;
    }

    try {
      const correctedUrl = await correctImageOrientation(file);
      setPhotoPreview(correctedUrl);
      setPhotoFile(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Erreur lors du traitement de l\'image');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const onSubmit = (data: ProjectFormData) => {
    if (!photoFile) {
      alert('Please add a photo');
      return;
    }

    if (!currentProject) {
      createProject(data);
    } else {
      updateProject(data);
    }
    
    setPhoto(photoFile, photoPreview!);
    
    // Skip mask step - go directly to result with Vision API
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="flex h-screen">
        {/* LEFT SIDE - Porsche style: Large image viewport */}
        <div className="flex-1 bg-black relative overflow-hidden">
          {!photoPreview ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`w-full h-full flex flex-col items-center justify-center transition-all ${
                  isDragging ? 'bg-gray-900' : 'bg-black'
                }`}
              >
                <div className="max-w-md text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-gray-700 flex items-center justify-center mx-auto mb-8">
                    <Upload className="w-10 h-10 text-gray-600" strokeWidth={1} />
                  </div>
                  <h3 className="text-2xl font-light text-white mb-4 tracking-wide">
                    Upload your space
                  </h3>
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Drag and drop or click to select
                    <br />
                    JPG or PNG, max 10 MB
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-xs uppercase tracking-widest font-medium hover:bg-gray-100 transition-all"
                    >
                      <Upload className="w-4 h-4" strokeWidth={2} />
                      Choose File
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-transparent text-white border border-gray-700 text-xs uppercase tracking-widest font-medium hover:border-gray-500 transition-all"
                    >
                      <Camera className="w-4 h-4" strokeWidth={2} />
                      Take Photo
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full group">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="absolute top-8 right-8 p-3 bg-black/80 hover:bg-black text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
              
              {/* Image overlay info - Porsche style */}
              <div className="absolute bottom-8 left-8 text-white">
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                  Your Space
                </div>
                <div className="text-2xl font-light tracking-wide">
                  Ready to configure
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Porsche style: Configuration panel */}
        <div className="w-[480px] bg-white flex flex-col overflow-y-auto">
          {/* Panel header */}
          <div className="p-8 border-b border-gray-200">
            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
              Configuration
            </div>
            <h2 className="text-2xl font-light tracking-wide text-black">
              Project Details
            </h2>
          </div>

          {/* Scrollable config */}
          <div className="flex-1 p-8 space-y-8">
            {/* Project Name - Porsche style */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                Project Name
              </label>
              <input
                {...register('name')}
                placeholder="Visit - 19/01/2026"
                className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 focus:outline-none focus:border-black transition-all text-black placeholder-gray-400"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Area and Workstations - Porsche style */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                  Area (m²)
                </label>
                <input
                  type="number"
                  {...register('areaM2', { valueAsNumber: true })}
                  placeholder="100"
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 focus:outline-none focus:border-black transition-all text-black placeholder-gray-400"
                />
                {errors.areaM2 && <p className="text-xs text-red-500">{errors.areaM2.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                  Workstations
                </label>
                <input
                  type="number"
                  {...register('workstations', { valueAsNumber: true })}
                  placeholder="10"
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 focus:outline-none focus:border-black transition-all text-black placeholder-gray-400"
                />
                {errors.workstations && <p className="text-xs text-red-500">{errors.workstations.message}</p>}
              </div>
            </div>

            {/* Style Level - Porsche style: Clean selection */}
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                Standing Level
              </label>
              <div className="space-y-3">
                {[
                  {
                    value: 'basic',
                    label: 'Basic',
                    subtitle: 'Essential furniture',
                    icon: '💼',
                  },
                  {
                    value: 'standard',
                    label: 'Standard',
                    subtitle: 'Professional quality',
                    icon: '🏢',
                  },
                  {
                    value: 'premium',
                    label: 'Premium',
                    subtitle: 'Executive design',
                    icon: '✨',
                  },
                ].map((option) => {
                  const isSelected = watch('styleLevel') === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white hover:border-gray-400 text-black'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        {...register('styleLevel')}
                        className="sr-only"
                      />
                      <span className="text-xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className={`text-sm font-medium tracking-wide ${isSelected ? 'text-white' : 'text-black'}`}>
                          {option.label}
                        </div>
                        <div className={`text-[10px] mt-0.5 uppercase tracking-widest ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                          {option.subtitle}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 border-2 border-white rounded-full bg-white">
                          <div className="w-2 h-2 bg-black rounded-full m-0.5"></div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
              {errors.styleLevel && (
                <p className="text-xs text-red-600">{errors.styleLevel.message}</p>
              )}
            </div>

            {/* Meeting Tables Option - Porsche style */}
            <div className="flex items-start gap-4 p-4 border border-gray-200 bg-gray-50">
              <input
                type="checkbox"
                id="meetingTables"
                {...register('meetingTablesPreference')}
                className="mt-1 w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer"
              />
              <label htmlFor="meetingTables" className="flex-1 cursor-pointer">
                <span className="block text-sm font-medium text-black">
                  Add meeting spaces
                </span>
                <span className="block text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                  AI will integrate meeting areas if space allows
                </span>
              </label>
            </div>
          </div>

          {/* Submit CTA - Porsche style: Full width sticky */}
          <div className="p-8 border-t border-gray-200 bg-white">
            <button
              type="submit"
              className="w-full py-5 bg-black text-white text-xs uppercase tracking-widest font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-3 group"
            >
              <span>Generate Office</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
            </button>
            
            {/* Price indicator - Porsche style */}
            <div className="mt-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-gray-400">
                Estimated time
              </div>
              <div className="text-sm font-light text-gray-600 mt-1">
                ~2 minutes
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
