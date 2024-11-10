const fs = require('fs').promises;
const path = require('path');

// First, we need to install the required package
// Run: npm install heic-convert

async function convertHeicToJpeg(filePath) {
  try {
    // Import heic-convert dynamically to handle potential loading issues
    const heicConvert = require('heic-convert');
    const outputPath = filePath.replace(/\.HEIC$/i, '.jpg');
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

async function processDirectory(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath);
    let convertedCount = 0;

    console.log(`Processing directory: ${path.basename(directoryPath)}`);

    for (const file of files) {
      if (file.toUpperCase().endsWith('.HEIC')) {
        const filePath = path.join(directoryPath, file);
        const success = await convertHeicToJpeg(filePath);
        if (success) convertedCount++;
      }
    }

    return convertedCount;
  } catch (error) {
    console.error(`Error processing directory ${directoryPath}:`, error);
    return 0;
  }
}

async function main() {
  const baseDir = path.join(process.cwd(), 'public', 'images', 'albums');
  const albums = [
    'France', 'Monaco', 'Brazil', 'Vietnam', 'Singapore',
    'Malaysia', 'Slovenia', 'Italy', 'Switzerland',
    'Uruguay', 'Chile', 'Portugal','Spain','Argentina','Belgium','Bosnia','Croatia','Montenegro','Mauritius','Botswana','South-Africa','St-Barts',
    'Belize'
  ];

  console.log('Starting HEIC conversion...');
  let totalConverted = 0;

  for (const album of albums) {
    const albumPath = path.join(baseDir, album);
    try {
      // Check if directory exists before processing
      await fs.access(albumPath);
      const converted = await processDirectory(albumPath);
      totalConverted += converted;
      console.log(`Completed ${album}: ${converted} files converted`);
    } catch (error) {
      console.log(`Skipping ${album} - directory not found`);
    }
  }

  console.log(`\nConversion complete! Successfully converted ${totalConverted} files total`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});