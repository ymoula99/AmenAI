import { useState } from 'react';
import { useProjectStore } from './store/projectStore';
import { Layout } from './components/Layout';
import { ProjectInfoStep } from './components/ProjectInfoStep';
import { ResultStep } from './components/ResultStep';
import Catalog from './components/Catalog';
import { Sparkles } from 'lucide-react';

function App() {
  const { currentProject, currentStep, createProject } = useProjectStore();
  const [currentView, setCurrentView] = useState<'app' | 'catalog'>('app');

  // Show catalog view
  if (currentView === 'catalog') {
    return (
      <Layout 
        showStepper={false} 
        currentView={currentView} 
        onNavigate={setCurrentView}
      >
        <Catalog />
      </Layout>
    );
  }

  // Welcome screen - Porsche style: Full screen hero
  if (!currentProject) {
    return (
      <Layout showStepper={false} currentView={currentView} onNavigate={setCurrentView}>
        <div className="fixed inset-0 bg-black">
          {/* Hero Background Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjMiLz48L2c+PC9zdmc+')] opacity-20"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
            <div className="max-w-4xl w-full text-center animate-slide-up">
              {/* Porsche-style title */}
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-light text-white mb-6 tracking-wider uppercase">
                Office
                <span className="block font-normal mt-2">Configurator</span>
              </h1>
              
              <div className="w-24 h-px bg-white mx-auto my-8"></div>
              
              <p className="text-lg text-gray-400 mb-16 font-light tracking-wide max-w-2xl mx-auto">
                Configure your ideal workspace with AI precision.
                <br />
                From concept to visualization in minutes.
              </p>

              {/* CTA Button - Porsche style */}
              <button
                onClick={() => createProject({
                  name: 'New Office Project',
                  workstations: 10,
                  areaM2: 100,
                  budget: 50000,
                  styleLevel: 'standard',
                  meetingTablesPreference: true
                })}
                className="group inline-flex items-center gap-4 px-12 py-5 bg-white text-black font-medium tracking-widest uppercase text-sm hover:bg-gray-100 transition-all duration-300"
              >
                <span>Configure Now</span>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" strokeWidth={2} />
              </button>

              {/* Specs - Porsche style */}
              <div className="grid grid-cols-3 gap-8 mt-24 max-w-2xl mx-auto text-left border-t border-gray-800 pt-8">
                <div>
                  <div className="text-3xl font-light text-white mb-1">01</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Photo</div>
                </div>
                <div>
                  <div className="text-3xl font-light text-white mb-1">02</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Configure</div>
                </div>
                <div>
                  <div className="text-3xl font-light text-white mb-1">03</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Generate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Step router
  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentStep === 'info' && <ProjectInfoStep />}
      {currentStep === 'result' && <ResultStep />}
    </Layout>
  );
}

export default App;
