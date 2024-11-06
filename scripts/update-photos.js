// scripts/update-photos.js
const fs = require('fs').promises;
const path = require('path');

async function updatePhotosJson() {
  try {
    const photosPath = path.join(process.cwd(), 'src', 'data', 'photos.json');
    console.log('Reading photos.json...');
    
    const data = await fs.readFile(photosPath, 'utf8');
    const photosData = JSON.parse(data);

    // Update photo URLs from HEIC to jpg
    let updatedCount = 0;
    photosData.photos = photosData.photos.map(photo => {
      if (photo.url.toUpperCase().endsWith('.HEIC')) {
        updatedCount++;
        return {
          ...photo,
          url: photo.url.replace(/\.HEIC$/i, '.jpg')
        };
      }
      return photo;
    });

    // Write updated data back to file
    await fs.writeFile(
      photosPath,
      JSON.stringify(photosData, null, 2),
      'utf8'
    );

    console.log(`Successfully updated ${updatedCount} photo entries in photos.json`);
  } catch (error) {
    console.error('Error updating photos.json:', error);
  }
}

updatePhotosJson();