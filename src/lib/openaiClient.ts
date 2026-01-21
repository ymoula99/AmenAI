/**
 * OpenAI Client pour le browser
 * Wrapper autour de l'API OpenAI pour l'édition d'images
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface ImageEditOptions {
  image: File;
  mask: File;
  prompt: string;
  size?: '1024x1024' | '1536x1024' | '1024x1536';
}

/**
 * Obtient les dimensions d'une image
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Redimensionne une image aux dimensions spécifiées
 */
async function resizeImage(file: File, width: number, height: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de créer le context canvas'));
        return;
      }
      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Impossible de redimensionner l\'image'));
          return;
        }
        const newFileName = file.name.replace(/\.[^/.]+$/, '.png');
        resolve(new File([blob], newFileName, { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convertit une image en PNG si nécessaire
 */
async function convertToPNG(file: File): Promise<File> {
  if (file.type === 'image/png') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de créer le context canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Impossible de convertir en PNG'));
          return;
        }
        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Édite une image en utilisant l'API OpenAI DALL-E 2
 * Note: DALL-E 2 nécessite des images PNG avec canal alpha
 * @param options - Options d'édition
 * @returns URL de l'image éditée
 */
export async function editImageWithMask(options: ImageEditOptions): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('VITE_OPENAI_API_KEY non configurée. Ajoutez-la dans votre fichier .env');
  }

  const { image, mask, prompt, size = '1024x1024' } = options;

  console.log('🎨 Appel API OpenAI DALL-E 2 image edit...');
  console.log('📝 Prompt:', prompt.substring(0, 200) + '...');
  console.log('📷 Image:', { name: image.name, type: image.type, size: `${(image.size / 1024).toFixed(0)} KB` });
  console.log('🎭 Mask:', { name: mask.name, type: mask.type, size: `${(mask.size / 1024).toFixed(0)} KB` });

  try {
    // Convertir les images en PNG si nécessaire (requis par DALL-E 2)
    console.log('🔄 Conversion des images en PNG...');
    const imagePNG = await convertToPNG(image);
    let maskPNG = mask.type === 'image/png' ? mask : await convertToPNG(mask);

    // Obtenir les dimensions de l'image et du masque
    const imageDims = await getImageDimensions(imagePNG);
    const maskDims = await getImageDimensions(maskPNG);
    
    console.log('📐 Dimensions - Image:', imageDims, 'Mask:', maskDims);

    // Si les dimensions ne correspondent pas, redimensionner le masque
    if (imageDims.width !== maskDims.width || imageDims.height !== maskDims.height) {
      console.log(`⚙️ Redimensionnement du masque de ${maskDims.width}x${maskDims.height} vers ${imageDims.width}x${imageDims.height}...`);
      maskPNG = await resizeImage(maskPNG, imageDims.width, imageDims.height);
      console.log('✅ Masque redimensionné avec succès');
    }

    // Préparer le FormData pour l'API OpenAI
    const formData = new FormData();
    formData.append('image', imagePNG, 'image.png');
    formData.append('mask', maskPNG, 'mask.png');
    formData.append('prompt', prompt);
    formData.append('model', 'dall-e-2');
    formData.append('n', '1');
    formData.append('size', size);

    console.log('📤 Envoi de la requête à OpenAI...');

    // Appel direct à l'API OpenAI
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erreur OpenAI:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Messages d'erreur plus spécifiques
      if (response.status === 401) {
        throw new Error('Clé API OpenAI invalide. Vérifiez votre VITE_OPENAI_API_KEY.');
      } else if (response.status === 429) {
        throw new Error('Quota OpenAI dépassé. Ajoutez du crédit ou attendez.');
      } else if (response.status === 400) {
        throw new Error(`Requête invalide: ${errorData.error?.message || 'Vérifiez le format des images'}`);
      }
      
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    console.log('📥 Réponse OpenAI reçue:', { hasData: !!data.data, length: data.data?.length });
    
    if (!data.data || data.data.length === 0) {
      throw new Error('Aucune image générée par OpenAI');
    }

    const imageUrl = data.data[0].url;
    console.log('✅ Image générée avec succès:', imageUrl.substring(0, 80) + '...');
    
    return imageUrl;
  } catch (error) {
    console.error('❌ Erreur lors de l\'édition d\'image:', error);
    throw error;
  }
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
