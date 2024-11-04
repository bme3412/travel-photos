// src/app/api/albums/route.js
import { NextResponse } from 'next/server';
import albums from '../../../data/albums.json';

export async function GET() {  // Removed unused request parameter
  return NextResponse.json(albums);
}