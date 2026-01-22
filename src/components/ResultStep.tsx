import { useState, useEffect } from 'react';
import { Download, Share2, FileText, Home, Loader2, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import apiClient from '@/api/client';

// Helper: Create a full white mask for automatic processing (Porsche UX)
const createFullImageMask = async (imageFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        // Fill with white (full mask = edit entire image)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create mask'));
          }
        }, 'image/png');
      } else {
        reject(new Error('Canvas context not available'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

export const ResultStep = () => {
  const {
    currentProject,
    furnitureProposal,
    renderResult,
    setRenderResult,
    resetProject,
    isGenerating,
    setIsGenerating,
  } = useProjectStore();

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!renderResult && currentProject && !isGenerating) {
      generateRender();
    }
  }, []);

  const generateRender = async () => {
    if (!currentProject?.photoFile) {
      setError('Photo manquante');
      return;
    }

    if (!furnitureProposal) {
      setError('Proposition de mobilier manquante. Retournez à l\'étape précédente.');
      return;
    }

    console.log('🚀 ResultStep - Début génération avec proposition pré-calculée:', furnitureProposal);

    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      // Create automatic full-image mask if not exists (Porsche UX: no manual mask)
      let maskBlob: Blob;
      
      if (currentProject.maskDataUrl) {
        const response = await fetch(currentProject.maskDataUrl);
        maskBlob = await response.blob();
      } else {
        // Generate automatic white mask (full image coverage)
        maskBlob = await createFullImageMask(currentProject.photoFile);
      }

      console.log('📞 Appel apiClient.renderProject avec proposition:', furnitureProposal);

      const result = await apiClient.renderProject(
        currentProject.id,
        currentProject.photoFile,
        maskBlob,
        {
          name: currentProject.name,
          areaM2: currentProject.areaM2,
          workstations: currentProject.workstations,
          budget: currentProject.budget,
          styleLevel: currentProject.styleLevel,
          meetingTablesPreference: currentProject.meetingTablesPreference,
        },
        furnitureProposal, // Pass pre-calculated proposal
        (prog) => setProgress(prog)
      );

      console.log('✅ Résultat reçu:', result);

      setRenderResult(result);
    } catch (err: any) {
      console.error('❌ Render error:', err);
      setError(err.message || 'Erreur lors de la génération');
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!renderResult?.outputs[0]?.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = renderResult.outputs[0].imageUrl;
    link.download = `${currentProject?.name || 'render'}.jpg`;
    link.click();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentProject?.name,
        text: 'Découvrez mon aménagement de bureaux',
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Fonction de partage non disponible sur cet appareil');
    }
  };

  // Loading state
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-md w-full">
          <CardBody className="text-center space-y-6 py-12">
            <Loader2 className="w-16 h-16 mx-auto text-primary-600 animate-spin" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Génération en cours...
              </h3>
              <p className="text-sm text-gray-600">
                L'IA travaille sur votre aménagement (10-30s)
              </p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <p className="text-sm font-medium text-primary-600">{progress}%</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-md w-full border-red-200">
          <CardBody className="text-center space-y-6 py-12">
            <AlertCircle className="w-16 h-16 mx-auto text-red-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Erreur de génération
              </h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={generateRender} variant="primary">
                Réessayer
              </Button>
              <Button onClick={resetProject} variant="outline">
                Nouveau projet
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!renderResult) {
    return null;
  }

  const output = renderResult.outputs[0];
  const scenario = output.scenario;

  return (
    <div className="space-y-6 pb-12">
      {/* Success Banner */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardBody className="py-6">
          <h2 className="text-2xl font-bold mb-2">✨ Votre aménagement est prêt !</h2>
          <p className="text-green-50">
            Configuration générée avec succès pour {currentProject?.workstations} postes
          </p>
        </CardBody>
      </Card>

      {/* Rendered Image */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Image générée</h3>
        </CardHeader>
        <CardBody className="p-0">
          <img
            src={output.imageUrl}
            alt="Rendered office space"
            className="w-full h-auto"
          />
        </CardBody>
      </Card>

      {/* Scenario Details */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">{scenario.title}</h3>
        </CardHeader>
        <CardBody>
          {/* Price Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Achat</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(scenario.totals.buyRange.min)} - {formatPrice(scenario.totals.buyRange.max)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Location mensuelle</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatPrice(scenario.totals.rentRange.min)} - {formatPrice(scenario.totals.rentRange.max)}
              </p>
            </div>
          </div>

          {/* BOM */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Liste du mobilier (BOM)</h4>
            <div className="space-y-2">
              {scenario.bom.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">
                      Quantité: {item.qty} • SKU: {item.sku}
                    </p>
                  </div>
                  {item.unitPriceRange && (
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.unitPriceRange.min)} - {formatPrice(item.unitPriceRange.max)}
                      </p>
                      <p className="text-xs text-gray-600">par unité</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Notes importantes</h4>
            <ul className="space-y-1">
              {scenario.notes.map((note, idx) => (
                <li key={idx} className="text-sm text-blue-800 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button onClick={handleDownloadImage} variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button onClick={handleShare} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Exporter PDF
            </Button>
            <Button onClick={resetProject} variant="secondary">
              <Home className="w-4 h-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
