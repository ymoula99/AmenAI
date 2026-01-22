import { Check } from 'lucide-react';
import { Step } from '@/types';
import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: Step;
}

const steps: { id: Step; label: string; number: number }[] = [
  { id: 'info', label: 'Configure', number: 1 },
  { id: 'proposal', label: 'Validate', number: 2 },
  { id: 'result', label: 'Generate', number: 3 },
];

export const Stepper = ({ currentStep }: StepperProps) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Progress bar - Porsche style */}
      <div className="relative h-1 bg-gray-900">
        <div 
          className="absolute top-0 left-0 h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Steps - Porsche style: minimal labels */}
      <div className="py-4 px-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = step.id === currentStep;

            return (
              <div 
                key={step.id} 
                className={cn(
                  'flex items-center gap-3 transition-all',
                  (isCompleted || isCurrent) ? 'opacity-100' : 'opacity-40'
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-2 text-xs uppercase tracking-widest font-medium transition-colors',
                    isCurrent ? 'text-white' : 'text-gray-500'
                  )}
                >
                  <span className="text-[10px]">{step.number.toString().padStart(2, '0')}</span>
                  <span>{step.label}</span>
                </div>
                
                {isCompleted && (
                  <Check size={14} strokeWidth={2.5} className="text-gray-600" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
