// scripts/convert-heic.js
const fs = require('fs').promises;
const path = require('path');
const heicConvert = require('heic-convert');

async function convertHeicToJpeg(filePath) {
  try {
    const outputPath = filePath.replace('.HEIC', '.jpg');
    console.log(`Converting: ${path.basename(filePath)} to jpg`);

    // Read the HEIC file
    const inputBuffer = await fs.readFile(filePath);
    
    // Convert to JPEG
    const jpegBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.85
    });

    // Write the JPEG file
    await fs.writeFile(outputPath, jpegBuffer);
    
    console.log(`Successfully converted: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    const francePath = path.join(process.cwd(), 'public', 'images', 'albums', 'France');
    const monacoPath = path.join(process.cwd(), 'public', 'images', 'albums', 'Monaco');
    const brazilPath = path.join(process.cwd(), 'public', 'images', 'albums', 'Brazil');
    const vietnamPath = path.join(process.cwd(), 'public', 'images', 'albums', 'Vietnam');
    const singaporePath = path.join(process.cwd(), 'public', 'images', 'albums', 'Singapore');


    const files = await fs.readdir(singaporePath);
    let convertedCount = 0;
    
    console.log('Starting HEIC conversion...');
    
    for (const file of files) {
      if (file.toUpperCase().endsWith('.HEIC')) {
        const filePath = path.join(singaporePath, file);
        const success = await convertHeicToJpeg(filePath);
        if (success) convertedCount++;
      }
    }
    
    console.log(`Conversion complete! Successfully converted ${convertedCount} files`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();