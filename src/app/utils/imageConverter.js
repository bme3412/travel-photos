// src/app/utils/imageConverter.js
import heicConvert from 'heic-convert';
import sharp from 'sharp';

export async function convertHeicToJpeg(buffer) {
  try {
    const jpegBuffer = await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 0.85
    });
    return jpegBuffer;
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw error;
  }
}

