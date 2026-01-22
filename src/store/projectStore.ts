import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Step, RenderResponse, FurnitureSelection } from '@/types';

interface ProjectStore {
  currentProject: Project | null;
  currentStep: Step;
  furnitureProposal: FurnitureSelection | null;
  renderResult: RenderResponse | null;
  isGenerating: boolean;
  
  // Actions
  createProject: (data: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (updates: Partial<Project>) => void;
  setStep: (step: Step) => void;
  setPhoto: (file: File, url: string) => void;
  setMask: (maskDataUrl: string) => void;
  setFurnitureProposal: (proposal: FurnitureSelection) => void;
  setRenderResult: (result: RenderResponse) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  resetProject: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      currentProject: null,
      currentStep: 'info',
      furnitureProposal: null,
      renderResult: null,
      isGenerating: false,

      createProject: (data) => {
        const project: Project = {
          ...data,
          id: `project-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set({ currentProject: project, currentStep: 'info', renderResult: null });
      },

      updateProject: (updates) => {
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, ...updates }
            : null,
        }));
      },

      setStep: (step) => {
        set({ currentStep: step });
      },

      setPhoto: (file, url) => {
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, photoFile: file, photoUrl: url }
            : null,
        }));
      },

      setMask: (maskDataUrl) => {
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, maskDataUrl }
            : null,
        }));
      },

      setFurnitureProposal: (proposal) => {
        set({ furnitureProposal: proposal });
      },

      setRenderResult: (result) => {
        set({ renderResult: result, isGenerating: false });
      },

      setIsGenerating: (isGenerating) => {
        set({ isGenerating });
      },

      resetProject: () => {
        set({
          currentProject: null,
          currentStep: 'info',
          furnitureProposal: null,
          renderResult: null,
          isGenerating: false,
        });
      },
    }),
    {
      name: 'office-agent-storage',
      partialize: (state) => {
        // Ne persister que les données sérialisables
        const { currentProject, currentStep } = state;
        
        return {
          currentProject: currentProject
            ? {
                id: currentProject.id,
                name: currentProject.name,
                areaM2: currentProject.areaM2,
                workstations: currentProject.workstations,
                styleLevel: currentProject.styleLevel,
                meetingTablesPreference: currentProject.meetingTablesPreference,
                photoUrl: currentProject.photoUrl,
                maskDataUrl: currentProject.maskDataUrl,
                createdAt: currentProject.createdAt,
                // Exclure photoFile (File object non sérialisable)
              }
            : null,
          currentStep,
        };
      },
    }
  )
);
