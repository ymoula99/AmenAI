import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useCatalogStore } from '@/lib/catalogStore';
import { selectFurnitureFromCatalog } from '@/lib/furnitureSelector';
import { Card, CardBody, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { ArrowRight, CheckCircle2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProposalStep = () => {
  const { currentProject, setFurnitureProposal, setStep, furnitureProposal } = useProjectStore();
  const { products, loadProducts, isLoading } = useCatalogStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateProposal = async () => {
      if (!currentProject || furnitureProposal) return;

      try {
        setError(null);
        
        // Load catalog if not already loaded
        if (products.length === 0) {
          console.log('📦 ProposalStep - Chargement du catalogue...');
          await loadProducts();
        }

        // Get fresh state after loading
        const catalog = useCatalogStore.getState().products;
        console.log('✅ Catalogue chargé:', catalog.length, 'produits');

        if (catalog.length === 0) {
          throw new Error('Le catalogue est vide. Vérifiez votre connexion Supabase.');
        }

        // Calculate furniture selection
        console.log('🤖 Calcul de la proposition...');
        const selection = selectFurnitureFromCatalog(catalog, {
          budget: currentProject.budget,
          workstations: currentProject.workstations,
          styleLevel: currentProject.styleLevel,
          meetingTablesPreference: currentProject.meetingTablesPreference,
        });

        console.log('✅ Proposition calculée:', selection);
        setFurnitureProposal(selection);
      } catch (err) {
        console.error('❌ Erreur lors du calcul de la proposition:', err);
        setError(err instanceof Error ? err.message : 'Erreur de calcul');
      }
    };

    calculateProposal();
  }, [currentProject, products.length]);

  const handleValidate = () => {
    if (!furnitureProposal) {
      setError('Aucune proposition disponible');
      return;
    }
    setStep('result');
  };

  // Loading state
  if (isLoading || !furnitureProposal) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-md w-full">
          <CardBody className="text-center space-y-4 py-12">
            <Package className="w-16 h-16 mx-auto text-primary-600 animate-pulse" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Calcul de votre proposition...
              </h3>
              <p className="text-gray-600">
                Sélection du mobilier optimal selon vos critères
              </p>
            </div>
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
          <CardBody className="text-center space-y-4 py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur</h3>
              <p className="text-red-600">{error}</p>
            </div>
            <Button onClick={() => setStep('info')} variant="outline">
              Retour
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { items, totalCost, breakdown } = furnitureProposal;
  const remainingBudget = currentProject ? currentProject.budget - totalCost : 0;
  const isOverBudget = remainingBudget < 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Proposition d'aménagement</h2>
        <p className="text-gray-600">
          Nous avons sélectionné {items.length} articles pour votre projet "{currentProject?.name}"
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-50">
          <CardBody className="text-center p-4">
            <div className="text-3xl font-bold text-gray-900">{breakdown.desks || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Bureaux</div>
          </CardBody>
        </Card>
        
        <Card className="bg-gray-50">
          <CardBody className="text-center p-4">
            <div className="text-3xl font-bold text-gray-900">{breakdown.chairs || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Chaises</div>
          </CardBody>
        </Card>
        
        <Card className="bg-gray-50">
          <CardBody className="text-center p-4">
            <div className="text-3xl font-bold text-gray-900">{breakdown.storage || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Rangements</div>
          </CardBody>
        </Card>
        
        <Card className="bg-gray-50">
          <CardBody className="text-center p-4">
            <div className="text-3xl font-bold text-gray-900">{breakdown.meetingTables || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Tables de réunion</div>
          </CardBody>
        </Card>
      </div>

      {/* Budget Summary */}
      <Card className={cn(
        'border-2',
        isOverBudget ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
      )}>
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Budget alloué</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentProject?.budget.toLocaleString('fr-FR')} €
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Coût total</div>
              <div className={cn(
                'text-2xl font-bold',
                isOverBudget ? 'text-red-600' : 'text-green-600'
              )}>
                {totalCost.toLocaleString('fr-FR')} €
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">
                {isOverBudget ? 'Dépassement' : 'Reste'}
              </div>
              <div className={cn(
                'text-2xl font-bold',
                isOverBudget ? 'text-red-600' : 'text-green-600'
              )}>
                {Math.abs(remainingBudget).toLocaleString('fr-FR')} €
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Product List */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Détails de la sélection</h3>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-500">Type: {item.type}</span>
                    <span className="text-sm text-gray-500">Dimensions: {item.dimensions}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {item.price.toLocaleString('fr-FR')} €
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Unité</div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
        
        <CardFooter className="bg-gray-50 p-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep('info')}>
            Modifier les critères
          </Button>
          
          <Button onClick={handleValidate} className="gap-2">
            <CheckCircle2 size={20} />
            Valider et générer
            <ArrowRight size={20} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
