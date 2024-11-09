// src/utils/sharpConfig.js
import sharp from 'sharp';

// Configure sharp for lower memory usage
sharp.cache(false);
sharp.concurrency(1);

export const optimizeImage = async (buffer, options = {}) => {
  try {
    const result = await sharp(buffer, {
      failOnError: false,
      limitInputPixels: 50000000 // ~50MP
    })
      .resize(options.width || 1200, options.height || 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: options.quality || 75,
        mozjpeg: true,
        optimizeScans: true
      })
      .toBuffer();
    
    return result;
  } catch (error) {
    console.error('Image optimization error:', error);
    return buffer; // Return original buffer if optimization fails
  }
};

export default sharp;