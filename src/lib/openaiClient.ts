/**
 * OpenAI Client pour le browser
 * Utilise l'API Responses avec image_generation tool pour générer des images de bureaux meublés
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface ImageGenerationOptions {
  image: File;
  prompt: string;
  referenceImageUrls: string[]; // URLs des produits du catalogue
}

/**
 * Convertit un data URL en File
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Convertit un Blob en File
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Convertit un File en base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extraire seulement la partie base64 (sans le préfixe data:image/...)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Génère une image en utilisant l'API OpenAI Responses avec des images de référence
 * Cette méthode permet d'envoyer des URLs d'images de produits comme références
 */
export async function generateImageWithReferences(options: ImageGenerationOptions): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('VITE_OPENAI_API_KEY non configurée. Ajoutez-la dans votre fichier .env');
  }

  const { image, prompt, referenceImageUrls } = options;

  console.log('🎨 Appel API OpenAI Responses avec image_generation tool...');
  console.log('📝 Prompt:', prompt.substring(0, 200) + '...');
  console.log('📷 Image originale:', { name: image.name, type: image.type, size: `${(image.size / 1024).toFixed(0)} KB` });
  console.log('🖼️ Images de référence:', referenceImageUrls.length, 'URLs');

  try {
    // Convertir l'image en base64
    console.log('🔄 Conversion de l\'image en base64...');
    const imageBase64 = await fileToBase64(image);
    
    // Construire le contenu avec l'image de base et les images de référence
    const content: any[] = [
      {
        type: "input_text",
        text: prompt
      },
      {
        type: "input_image",
        image_url: `data:image/jpeg;base64,${imageBase64}`
      }
    ];

    // Ajouter les images de référence (URLs des produits)
    for (const url of referenceImageUrls) {
      try {
        // Télécharger l'image et la convertir en base64
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });
        if (!response.ok) {
          console.warn(`⚠️ Impossible de télécharger ${url}: HTTP ${response.status}`);
          continue;
        }
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Utiliser le type MIME de la réponse
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        content.push({
          type: "input_image",
          image_url: `data:${contentType};base64,${base64}`
        });
      } catch (err) {
        console.warn(`⚠️ Erreur lors du téléchargement de ${url}:`, err);
      }
    }

    console.log('📤 Envoi de la requête à OpenAI Responses API...');
    console.log('📋 Contenu:', content.length, 'éléments (1 texte + 1 image base +', referenceImageUrls.length, 'références)');

    // Appel à l'API OpenAI Responses
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        input: [
          {
            role: 'user',
            content: content
          }
        ],
        tools: [{ type: 'image_generation' }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erreur OpenAI:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 401) {
        throw new Error('Clé API OpenAI invalide. Vérifiez votre VITE_OPENAI_API_KEY.');
      } else if (response.status === 429) {
        throw new Error('Quota OpenAI dépassé. Ajoutez du crédit ou attendez.');
      } else if (response.status === 400) {
        throw new Error(`Requête invalide: ${errorData.error?.message || 'Vérifiez le format'}`);
      }
      
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    console.log('📥 Réponse OpenAI reçue:', data);
    
    // Extraire les appels image_generation
    const imageGenerationCalls = data.output?.filter(
      (output: any) => output.type === 'image_generation_call'
    ) || [];

    if (imageGenerationCalls.length === 0) {
      throw new Error('Aucun appel image_generation dans la réponse');
    }

    // Récupérer l'image générée (base64)
    const imageBase64Result = imageGenerationCalls[0].result;
    
    if (!imageBase64Result) {
      throw new Error('Aucune image générée par OpenAI');
    }

    // Convertir le base64 en data URL pour affichage
    const imageDataUrl = `data:image/png;base64,${imageBase64Result}`;
    console.log('✅ Image générée avec succès (base64 length:', imageBase64Result.length, ')');
    
    return imageDataUrl;
  } catch (error) {
    console.error('❌ Erreur lors de la génération d\'image:', error);
    throw error;
  }
}
