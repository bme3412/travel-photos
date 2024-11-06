const fs = require('fs').promises;
const path = require('path');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function updatePhotosJson() {
  try {
    const photosPath = path.join(process.cwd(), 'src', 'data', 'photos.json');
    console.log('Reading photos.json...');
    
    const data = await fs.readFile(photosPath, 'utf8');
    const photosData = JSON.parse(data);
    
    // Keep track of changes
    const changes = {
      updated: [],
      notFound: [],
      skipped: []
    };
    
    // Update photo URLs from HEIC to jpg
    const updatedPhotos = await Promise.all(photosData.photos.map(async (photo) => {
      console.log(`Processing: ${photo.url}`);
      
      if (photo.url.toUpperCase().endsWith('.HEIC')) {
        const newUrl = photo.url.replace(/\.HEIC$/i, '.jpg');
        const jpgPath = path.join(process.cwd(), 'public', newUrl);
        
        const exists = await fileExists(jpgPath);
        
        if (exists) {
          changes.updated.push({
            old: photo.url,
            new: newUrl
          });
          
          return {
            ...photo,
            url: newUrl
          };
        } else {
          changes.notFound.push(photo.url);
          console.warn(`Warning: JPG file not found at ${jpgPath}`);
          return photo;
        }
      } else {
        changes.skipped.push(photo.url);
        return photo;
      }
    }));
    
    photosData.photos = updatedPhotos;
    
    // Create backup before writing changes
    const backupPath = photosPath + '.backup';
    await fs.copyFile(photosPath, backupPath);
    console.log(`\n✓ Backup created at ${backupPath}`);
    
    // Write updated data back to file
    await fs.writeFile(
      photosPath,
      JSON.stringify(photosData, null, 2),
      'utf8'
    );
    
    // Print detailed report
    console.log('\nUpdate Complete:');
    console.log(`✓ Updated ${changes.updated.length} photo entries`);
    console.log(`- Skipped ${changes.skipped.length} non-HEIC files`);
    
    if (changes.updated.length > 0) {
      console.log('\nUpdated files:');
      changes.updated.forEach(change => {
        console.log(`  ${change.old} → ${change.new}`);
      });
    }
    
    if (changes.notFound.length > 0) {
      console.log('\nWarning: JPG files not found for:');
      changes.notFound.forEach(file => {
        console.log(`  ${file}`);
      });
    }
    
  } catch (error) {
    console.error('Error updating photos.json:', error);
    process.exit(1);
  }
}

updatePhotosJson();