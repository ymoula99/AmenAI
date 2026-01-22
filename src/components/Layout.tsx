import { Building2, Home, Sparkles, TestTube, Package } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { Stepper } from './Stepper';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  showStepper?: boolean;
  currentView?: 'app' | 'catalog';
  onNavigate?: (view: 'app' | 'catalog') => void;
}

const USE_REAL_OPENAI = import.meta.env.VITE_USE_OPENAI === 'true';
const MOCK_MODE = import.meta.env.VITE_MOCK_API !== 'false';

export const Layout = ({ children, showStepper = true, currentView = 'app', onNavigate }: LayoutProps) => {
  const { currentProject, currentStep, resetProject } = useProjectStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Porsche style: Dark, premium, wide */}
      <header className="bg-black text-white border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Logo - Porsche inspired */}
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-white" strokeWidth={1.5} />
                <div>
                  <h1 className="text-sm font-medium tracking-widest uppercase">
                    Mes Bureaux
                  </h1>
                  {currentProject && (
                    <p className="text-[10px] text-gray-500 font-light tracking-wide uppercase">
                      {currentProject.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation Tabs - Porsche style */}
              {onNavigate && (
                <div className="hidden md:flex items-center gap-0 ml-8 border-l border-gray-800 pl-8">
                  <button
                    onClick={() => onNavigate('app')}
                    className={`px-4 py-2 text-[10px] font-medium uppercase tracking-widest transition-colors ${
                      currentView === 'app'
                        ? 'text-white border-b-2 border-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Configurateur
                  </button>
                  <button
                    onClick={() => onNavigate('catalog')}
                    className={`px-4 py-2 text-[10px] font-medium uppercase tracking-widest transition-colors flex items-center gap-2 ${
                      currentView === 'catalog'
                        ? 'text-white border-b-2 border-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Package className="w-3 h-3" />
                    Catalogue
                  </button>
                </div>
              )}
              
              {/* API Status Badge - Porsche style */}
              <div className="hidden md:flex items-center gap-3 ml-8 border-l border-gray-800 pl-8">
                {USE_REAL_OPENAI ? (
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span>AI Active</span>
                  </div>
                ) : MOCK_MODE ? (
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    <span>Demo Mode</span>
                  </div>
                ) : null}
              </div>
            </div>
            
            {currentProject && currentStep !== 'result' && (
              <button
                onClick={resetProject}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-medium text-gray-400 hover:text-white transition-colors uppercase tracking-widest border border-gray-800 hover:border-gray-700"
              >
                <Home className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Nouveau Projet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stepper - Porsche style: Horizontal progress bar */}
      {showStepper && currentProject && (
        <div className="bg-black border-b border-gray-800">
          <div className="max-w-7xl mx-auto">
            <Stepper currentStep={currentStep} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="mt-auto py-8 border-t border-gray-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            Office Agent © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};
