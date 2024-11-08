// scripts/migrate-to-s3.js
const { readdir, readFile, stat } = require('fs/promises');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
require('dotenv').config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

async function isDirectory(path) {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function uploadToS3(file, albumName, fileName) {
  try {
    // Process image with sharp
    let imageBuffer = file;
    const metadata = await sharp(file).metadata();

    // Resize if image is too large
    if (metadata.width > 1920 || metadata.height > 1920) {
      imageBuffer = await sharp(file)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 80,
          mozjpeg: true
        })
        .toBuffer();
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `albums/${albumName}/${fileName}`,
      Body: imageBuffer,
      ContentType: `image/${path.extname(fileName).slice(1).toLowerCase()}`,
      ACL: 'public-read'
    });

    await s3Client.send(command);
    return {
      key: `albums/${albumName}/${fileName}`,
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/albums/${albumName}/${fileName}`
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

async function migrateImages() {
  try {
    const albumsPath = path.join(process.cwd(), 'public', 'images', 'albums');
    const albums = await readdir(albumsPath);
    let totalProcessed = 0;
    let totalUploaded = 0;
    let totalSkipped = 0;
    
    console.log('🚀 Starting migration...\n');

    for (const album of albums) {
      const albumPath = path.join(albumsPath, album);
      
      // Skip if not a directory
      if (!(await isDirectory(albumPath))) {
        console.log(`⏭️  Skipping non-directory: ${album}`);
        continue;
      }

      console.log(`\n📁 Processing album: ${album}`);
      const images = await readdir(albumPath);
      let albumProcessed = 0;
      let albumSkipped = 0;
      let albumUploaded = 0;
      
      for (const image of images) {
        albumProcessed++;
        totalProcessed++;
        const extension = path.extname(image).toLowerCase();
        
        // Skip HEIC files and non-image files
        if (!VALID_EXTENSIONS.includes(extension)) {
          console.log(`⏭️  Skipping unsupported file: ${image}`);
          albumSkipped++;
          totalSkipped++;
          continue;
        }

        try {
          const filePath = path.join(albumPath, image);
          const fileContent = await readFile(filePath);
          
          const result = await uploadToS3(fileContent, album, image);
          
          albumUploaded++;
          totalUploaded++;
          console.log(`✅ Uploaded: ${image}`);
          console.log(`   URL: ${result.url}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${image}:`, error);
        }
      }

      console.log(`\n📊 Album "${album}" summary:`);
      console.log(`   Files processed: ${albumProcessed}`);
      console.log(`   Files uploaded: ${albumUploaded}`);
      console.log(`   Files skipped: ${albumSkipped}`);
    }

    console.log('\n🎉 Migration Complete!');
    console.log('📊 Final Summary:');
    console.log(`   Total files processed: ${totalProcessed}`);
    console.log(`   Total files uploaded: ${totalUploaded}`);
    console.log(`   Total files skipped: ${totalSkipped}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Check required environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'AWS_REGION'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Run migration
migrateImages().catch(console.error);