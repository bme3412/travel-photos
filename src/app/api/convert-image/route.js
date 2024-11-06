// src/app/api/convert-image/route.js
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Image URL is required', { status: 400 });
    }

    // Remove leading slash and get full path
    const imagePath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
    
    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch {
      console.error('File not found:', imagePath);
      return new NextResponse('File not found', { status: 404 });
    }

    // Read the HEIC file
    const buffer = await fs.readFile(imagePath);

    // Convert to JPEG using sharp
    const jpegBuffer = await sharp(buffer, { 
      failOnError: false,
      density: 300
    })
      .jpeg({ 
        quality: 85,
        mozjpeg: true,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer();

    // Return the converted image
    return new NextResponse(jpegBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': jpegBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Error converting image:', err);
    return new NextResponse(err.message, { status: 500 });
  }
}