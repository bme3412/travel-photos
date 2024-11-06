// src/app/utils/imageConverter.js
import heicConvert from 'heic-convert';

export async function convertHeicToJpeg(buffer) {
  try {
    const jpegBuffer = await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 0.85
    });
    return jpegBuffer;
  } catch (err) {
    console.error('Error converting HEIC to JPEG:', err);
    throw err;
  }
}