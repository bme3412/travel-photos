// src/app/api/albums/[id]/route.js
import { NextResponse } from 'next/server';
import albums from '../../../../data/albums.json';

export async function GET(request, { params }) {
  const { id } = params;
  const album = albums.find((album) => album.id === id);

  if (album) {
    return NextResponse.json(album);
  } else {
    return NextResponse.json({ message: 'Album not found' }, { status: 404 });
  }
}