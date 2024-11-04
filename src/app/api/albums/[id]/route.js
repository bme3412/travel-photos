// src/app/api/albums/[id]/route.js
import { NextResponse } from 'next/server';
import albums from '@/data/albums.json';

export async function GET(request, { params }) {
  try {
    const id = await params.id;
    const album = albums.find(album => album.id === id);
    
    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    );
  }
}