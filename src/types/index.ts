// Types pour le projet
export type StyleLevel = 'basic' | 'standard' | 'premium';

export interface ProjectFormData {
  name: string;
  areaM2: number;
  workstations: number;
  budget: number;
  styleLevel: StyleLevel;
  meetingTablesPreference: boolean;
}

export interface Project extends ProjectFormData {
  id: string;
  photoFile?: File;
  photoUrl?: string;
  maskDataUrl?: string;
  createdAt: string;
}

export interface BOMItem {
  sku: string;
  label: string;
  qty: number;
  unitPriceRange?: { min: number; max: number };
  type: string;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface Scenario {
  title: string;
  bom: BOMItem[];
  totals: {
    buyRange: PriceRange;
    rentRange: PriceRange;
  };
  notes: string[];
}

export interface RenderOutput {
  imageUrl: string;
  scenario: Scenario;
}

export interface RenderResponse {
  renderId: string;
  outputs: RenderOutput[];
}

// Furniture selection types
export interface FurnitureSelection {
  items: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    type: string;
    dimensions: string;
  }>;
  totalCost: number;
  breakdown: {
    desks: number;
    chairs: number;
    storage: number;
    meetingTables: number;
    other: number;
  };
}

export type Step = 'info' | 'proposal' | 'result';
