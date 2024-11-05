// src/app/utils/fileHandler.js

import fs from 'fs/promises';
import path from 'path';

/**
 * Reads and parses JSON data from a specified file.
 * @param {string} filename - The name of the JSON file to read.
 * @returns {Promise<Object|null>} - The parsed JSON data or null if an error occurs.
 */
async function readJsonFile(filename) {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', filename);
    const rawData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

export async function readAlbums() {
  return await readJsonFile('albums.json');
}

export async function readPhotos() {
  return await readJsonFile('photos.json');
}

export async function readLocations() {
  return await readJsonFile('locations.json');
}
