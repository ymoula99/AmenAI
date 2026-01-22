import { describe, it, expect } from 'vitest';
import { selectFurnitureFromCatalog } from '../../src/lib/furnitureSelector';

const mockCatalog = [
  {
    id: 'desk-1',
    name: 'Bureau Standard',
    description: 'Bureau de travail',
    price: 200,
    imageUrl: 'https://example.com/desk.jpg',
    type: 'desk',
    dimensions: '120x60x75 cm',
    brand: 'TestBrand',
    material: 'Bois',
    color: 'Noir',
  },
  {
    id: 'chair-1',
    name: 'Chaise Ergonomique',
    description: 'Chaise de bureau',
    price: 150,
    imageUrl: 'https://example.com/chair.jpg',
    type: 'chair',
    dimensions: '50x50x100 cm',
    brand: 'TestBrand',
    material: 'Tissu',
    color: 'Gris',
  },
  {
    id: 'storage-1',
    name: 'Armoire',
    description: 'Rangement',
    price: 300,
    imageUrl: 'https://example.com/storage.jpg',
    type: 'storage',
    dimensions: '100x50x180 cm',
    brand: 'TestBrand',
    material: 'Métal',
    color: 'Blanc',
  },
];

describe('selectFurnitureFromCatalog', () => {
  it('should return items within budget', () => {
    const result = selectFurnitureFromCatalog(mockCatalog, {
      budget: 1000,
      workstations: 2,
      styleLevel: 'standard',
      meetingTablesPreference: false,
    });

    expect(result.totalCost).toBeLessThanOrEqual(1000);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('should include desks and chairs for workstations', () => {
    const result = selectFurnitureFromCatalog(mockCatalog, {
      budget: 5000,
      workstations: 3,
      styleLevel: 'standard',
      meetingTablesPreference: false,
    });

    expect(result.breakdown.desks).toBe(3);
    expect(result.breakdown.chairs).toBe(3);
  });

  it('should return empty selection if budget is zero', () => {
    const result = selectFurnitureFromCatalog(mockCatalog, {
      budget: 0,
      workstations: 2,
      styleLevel: 'standard',
      meetingTablesPreference: false,
    });

    expect(result.items.length).toBe(0);
    expect(result.totalCost).toBe(0);
  });
});
