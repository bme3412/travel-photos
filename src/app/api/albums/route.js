// src/app/api/albums/route.js
import { NextResponse } from 'next/server';
import albums from '@/data/albums.json';

export async function GET() {
  try {
    return NextResponse.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}