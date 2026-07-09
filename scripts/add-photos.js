#!/usr/bin/env node

const { readdir, readFile, writeFile, stat } = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
require('dotenv').config();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Utility functions
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic'];

async function loadJsonFile(filename) {
  const filePath = path.join(process.cwd(), 'src', 'data', filename);
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function saveJsonFile(filename, data) {
  const filePath = path.join(process.cwd(), 'src', 'data', filename);
  // Create backup
  const backupPath = `${filePath}.backup`;
  await writeFile(backupPath, await readFile(filePath, 'utf8'));
  console.log(c('green', `✓ Backup created: ${filename}.backup`));
  
  // Save with nice formatting
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(c('green', `✓ Updated: ${filename}`));
}

async function uploadToS3(file, albumName, fileName) {
  try {
    let imageBuffer = file;
    const metadata = await sharp(file).metadata();

    // Auto-rotate based on EXIF orientation
    let processedImage = sharp(file).rotate();

    // Resize if too large
    if (metadata.width > 1920 || metadata.height > 1920) {
      processedImage = processedImage.resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to JPEG if needed
    imageBuffer = await processedImage
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    const key = `albums/${albumName}/${fileName.replace(/\.[^.]+$/, '.jpg')}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
    });

    await s3Client.send(command);
    
    // Return CloudFront URL if available
    const domain = process.env.CLOUDFRONT_DOMAIN || `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    return `https://${domain}/${key}`;
  } catch (error) {
    console.error(c('red', `Error uploading ${fileName}:`), error.message);
    throw error;
  }
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function getPhotoMetadata(filePath) {
  try {
    const buffer = await readFile(filePath);
    const metadata = await sharp(buffer).metadata();
    
    // Try to extract EXIF date
    let dateCreated = new Date().toISOString().split('T')[0];
    if (metadata.exif) {
      const exifDate = metadata.exif.toString().match(/\d{4}:\d{2}:\d{2}/);
      if (exifDate) {
        dateCreated = exifDate[0].replace(/:/g, '-');
      }
    }
    
    return { dateCreated, width: metadata.width, height: metadata.height };
  } catch (error) {
    return { dateCreated: new Date().toISOString().split('T')[0], width: 0, height: 0 };
  }
}

// Country code lookup (common ones)
const COUNTRY_CODES = {
  'argentina': 'AR', 'australia': 'AU', 'austria': 'AT', 'belgium': 'BE', 'belize': 'BZ',
  'botswana': 'BW', 'brazil': 'BR', 'chile': 'CL', 'china': 'CN', 'croatia': 'HR',
  'czech republic': 'CZ', 'estonia': 'EE', 'finland': 'FI', 'france': 'FR', 'germany': 'DE',
  'guatemala': 'GT', 'hong kong': 'HK', 'hungary': 'HU', 'indonesia': 'ID', 'italy': 'IT',
  'japan': 'JP', 'malaysia': 'MY', 'mauritius': 'MU', 'monaco': 'MC', 'montenegro': 'ME',
  'netherlands': 'NL', 'portugal': 'PT', 'singapore': 'SG', 'slovenia': 'SI', 'spain': 'ES',
  'south africa': 'ZA', 'switzerland': 'CH', 'thailand': 'TH', 'uk': 'GB', 'united kingdom': 'GB',
  'usa': 'US', 'united states': 'US', 'uruguay': 'UY', 'vatican': 'VA', 'vietnam': 'VN',
  'new zealand': 'NZ', 'cook islands': 'CK',
};

// Flag emoji lookup
const FLAG_EMOJIS = {
  'AR': '🇦🇷', 'AU': '🇦🇺', 'AT': '🇦🇹', 'BE': '🇧🇪', 'BZ': '🇧🇿', 'BW': '🇧🇼', 'BR': '🇧🇷',
  'CL': '🇨🇱', 'CN': '🇨🇳', 'HR': '🇭🇷', 'CZ': '🇨🇿', 'EE': '🇪🇪', 'FI': '🇫🇮', 'FR': '🇫🇷',
  'DE': '🇩🇪', 'GT': '🇬🇹', 'HK': '🇭🇰', 'HU': '🇭🇺', 'ID': '🇮🇩', 'IT': '🇮🇹', 'JP': '🇯🇵',
  'MY': '🇲🇾', 'MU': '🇲🇺', 'MC': '🇲🇨', 'ME': '🇲🇪', 'NL': '🇳🇱', 'PT': '🇵🇹', 'SG': '🇸🇬',
  'SI': '🇸🇮', 'ES': '🇪🇸', 'ZA': '🇿🇦', 'CH': '🇨🇭', 'TH': '🇹🇭', 'GB': '🇬🇧', 'US': '🇺🇸',
  'UY': '🇺🇾', 'VA': '🇻🇦', 'VN': '🇻🇳', 'NZ': '🇳🇿', 'CK': '🇨🇰',
};

async function main() {
  console.log('\n' + c('bright', '📸 Travel Photos - Add New Photos Tool') + '\n');
  console.log(c('cyan', 'This tool will help you:'));
  console.log('  1. Create a new album (or use existing)');
  console.log('  2. Upload photos to S3');
  console.log('  3. Update all JSON files automatically\n');

  try {
    // Load existing data
    const albumsData = await loadJsonFile('albums.json');
    const photosData = await loadJsonFile('photos.json');
    const destinationsData = await loadJsonFile('destinations.json');

    // Step 1: Get photo directory
    console.log(c('bright', '\n📁 Step 1: Photo Location'));
    const photoDir = await question('Enter the folder path with your photos (e.g., public/images/albums/NewAlbum): ');
    
    const fullPath = path.resolve(photoDir);
    try {
      const stats = await stat(fullPath);
      if (!stats.isDirectory()) {
        throw new Error('Not a directory');
      }
    } catch (error) {
      console.log(c('red', `✗ Error: Directory not found: ${fullPath}`));
      rl.close();
      return;
    }

    // Get photos from directory
    const allFiles = await readdir(fullPath);
    const photoFiles = allFiles.filter(f => {
      const ext = path.extname(f).toLowerCase();
      if (!VALID_EXTENSIONS.includes(ext)) return false;
      
      // Skip HEIC files if a JPG version exists
      if (ext === '.heic') {
        const baseNameWithoutExt = f.replace(/\.heic$/i, '');
        const jpgVersion = allFiles.find(file => 
          file.toLowerCase() === `${baseNameWithoutExt.toLowerCase()}.jpg`
        );
        if (jpgVersion) {
          return false; // Skip this HEIC file
        }
      }
      
      return true;
    });

    if (photoFiles.length === 0) {
      console.log(c('red', '✗ No valid photos found in directory'));
      rl.close();
      return;
    }

    console.log(c('green', `✓ Found ${photoFiles.length} photo(s)`));

    // Step 2: Album information
    console.log(c('bright', '\n🗂️  Step 2: Album Information'));
    
    const existingAlbumAnswer = await question('Use existing album? (y/n): ');
    
    let album;
    if (existingAlbumAnswer.toLowerCase() === 'y') {
      console.log('\nExisting albums:');
      albumsData.albums.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.name} (${a.year}) - ID: ${a.id}`);
      });
      const albumId = await question('\nEnter album ID: ');
      album = albumsData.albums.find(a => a.id === albumId);
      
      if (!album) {
        console.log(c('red', '✗ Album not found'));
        rl.close();
        return;
      }
    } else {
      // Create new album
      const albumName = await question('Album name (e.g., Japan): ');
      const albumYear = await question('Year (e.g., 2024): ');
      const albumCountry = await question('Country: ');
      
      const albumId = generateSlug(albumName);
      const countryId = COUNTRY_CODES[albumCountry.toLowerCase()] || 
                       (await question(`Country code for ${albumCountry} (e.g., JP): `)).toUpperCase();
      
      const flagEmoji = FLAG_EMOJIS[countryId] || '🌍';
      
      album = {
        id: albumId,
        name: `${flagEmoji} ${albumName}`,
        countryId: countryId,
        year: albumYear,
      };
      
      albumsData.albums.push(album);
      console.log(c('green', `✓ Created album: ${album.name}`));
    }

    // Step 3: Photo details
    console.log(c('bright', '\n📷 Step 3: Photo Details'));
    
    const locationName = await question('Location/City name (e.g., Tokyo): ');
    const locationCountry = await question(`Country (default: ${album.name.replace(/.*\s/, '')}): `) || album.name.replace(/.*\s/, '');
    const locationDescription = await question('Short description of this location: ');
    
    console.log('\n' + c('cyan', '📍 Getting coordinates (paste from Google Maps):'));
    console.log('   Right-click on Google Maps > Click coordinates to copy');
    console.log('   Format: "35.6762, 139.6503" (latitude, longitude)\n');
    
    const coordsInput = await question('Coordinates: ');
    const [latStr, lngStr] = coordsInput.split(',').map(s => s.trim());
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      console.log(c('red', '✗ Invalid coordinates'));
      rl.close();
      return;
    }

    // Step 4: Upload photos
    console.log(c('bright', '\n☁️  Step 4: Uploading Photos to S3'));
    
    const uploadedPhotos = [];
    const albumDirName = path.basename(fullPath);
    
    // Find the highest existing photo number for this album
    const existingAlbumPhotos = photosData.photos.filter(p => p.albumId === album.id);
    const maxPhotoNum = existingAlbumPhotos.reduce((max, photo) => {
      const num = parseInt(photo.id.replace(album.id, '')) || 0;
      return Math.max(max, num);
    }, 0);
    
    for (let i = 0; i < photoFiles.length; i++) {
      const fileName = photoFiles[i];
      const filePath = path.join(fullPath, fileName);
      
      console.log(`\n[${i + 1}/${photoFiles.length}] ${fileName}`);
      
      try {
        // Get metadata
        const { dateCreated } = await getPhotoMetadata(filePath);
        
        // Upload
        const fileBuffer = await readFile(filePath);
        const url = await uploadToS3(fileBuffer, albumDirName, fileName);
        console.log(c('green', `  ✓ Uploaded: ${url}`));
        
        // Use location name as default caption
        const caption = locationName;
        const tags = '';
        
        // Create photo entry with unique ID (starting from max existing + 1)
        const photoId = `${album.id}${maxPhotoNum + uploadedPhotos.length + 1}`;
        
        uploadedPhotos.push({
          id: photoId,
          albumId: album.id,
          url: url,
          caption: caption || `${locationName}`,
          locationId: locationName,
          coordinates: {
            lng: longitude,
            lat: latitude,
          },
          dateCreated: dateCreated,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
        });
      } catch (error) {
        console.log(c('yellow', `  ⚠️  Skipped (corrupted file): ${error.message}`));
        continue;
      }
    }

    // Step 5: Update destination
    console.log(c('bright', '\n📍 Step 5: Updating Destinations'));
    
    // Handle both array and object formats
    const destinationsArray = Array.isArray(destinationsData) ? destinationsData : destinationsData.destinations;
    
    const existingDest = destinationsArray.find(
      d => d.name.toLowerCase() === locationName.toLowerCase()
    );
    
    if (existingDest) {
      console.log(c('yellow', `→ Using existing destination: ${existingDest.name}`));
    } else {
      const nextId = String(Math.max(...destinationsArray.map(d => parseInt(d.id))) + 1);
      const newDestination = {
        id: nextId,
        name: locationName,
        country: locationCountry,
        description: locationDescription,
        latitude: latitude,
        longitude: longitude,
      };
      destinationsArray.push(newDestination);
      console.log(c('green', `✓ Added new destination: ${locationName}`));
    }

    // Step 6: Save everything
    console.log(c('bright', '\n💾 Step 6: Saving Changes'));
    
    photosData.photos.push(...uploadedPhotos);
    
    await saveJsonFile('albums.json', albumsData);
    await saveJsonFile('photos.json', photosData);
    // Save destinations in the same format it was loaded
    await saveJsonFile('destinations.json', Array.isArray(destinationsData) ? destinationsArray : destinationsData);

    // Summary
    console.log('\n' + c('bright', '✨ Summary:'));
    console.log(c('green', `  ✓ Album: ${album.name} (${album.year})`));
    console.log(c('green', `  ✓ Uploaded: ${uploadedPhotos.length} photo(s)`));
    console.log(c('green', `  ✓ Location: ${locationName}, ${locationCountry}`));
    console.log('\n' + c('cyan', '🚀 Next steps:'));
    console.log('  1. Test locally: npm run dev');
    console.log('  2. Verify photos appear correctly');
    console.log('  3. Deploy: git add . && git commit -m "Add photos" && git push\n');

  } catch (error) {
    console.error(c('red', '\n✗ Error:'), error.message);
    console.error(error.stack);
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(console.error);

