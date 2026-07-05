// src/app/utils/fileHandler.js

import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';

// The JSON data files are bundled with the deployment and immutable at
// runtime, so parsed results are memoized for the life of the process.
const parsedFiles = new Map();

/**
 * Reads and parses JSON data from a specified file.
 * Wrapped in React cache() so repeated calls within one render pass
 * (e.g. generateMetadata + the page itself) share a single read.
 * @param {string} filename - The name of the JSON file to read.
 * @returns {Promise<Object|null>} - The parsed JSON data or null if an error occurs.
 */
const readJsonFile = cache(async (filename) => {
  if (parsedFiles.has(filename)) {
    return parsedFiles.get(filename);
  }
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', filename);
    const rawData = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(rawData);
    parsedFiles.set(filename, data);
    return data;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
});

export async function readAlbums() {
  return await readJsonFile('albums.json');
}

export async function readPhotos() {
  return await readJsonFile('photos.json');
}

export async function readLocations() {
  return await readJsonFile('locations.json');
}
