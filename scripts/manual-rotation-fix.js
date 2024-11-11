// scripts/manual-rotation-fix.js
const { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// List of files that need rotation and their rotation angle
const rotationMap = {
    'guatemala-tikal-3.jpg': 90,
  'guatemala-tikal-4.jpg': 90,
  'guatemala-tikal-5.jpg': 90,
  'guatemala-tikal-6.jpg': 90,
  'guatemala-tikal-pano.jpg': 90,
  'guatemala-tikal.jpg': 90,

};

async function manuallyFixRotation() {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: 'albums/Guatemala/'
    });

    const { Contents } = await s3Client.send(listCommand);
    console.log(`Found ${Contents.length} files to process...`);

    for (const object of Contents) {
      const fileName = object.Key.split('/').pop(); // Get just the filename
      
      // Skip if this file doesn't need rotation
      if (!rotationMap[fileName]) {
        console.log(`Skipping ${fileName} - no rotation needed`);
        continue;
      }

      // Create new filename with _rotated
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      const fileExt = fileName.substring(fileName.lastIndexOf('.'));
      const newFileName = `${fileNameWithoutExt}_rotated${fileExt}`;
      const newKey = `albums/Guatemala/${newFileName}`;

      console.log(`Processing: ${fileName} with rotation ${rotationMap[fileName]}°`);

      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: object.Key
      });

      const { Body } = await s3Client.send(getCommand);
      const buffer = await streamToBuffer(Body);

      // Process with manual rotation
      const processedBuffer = await sharp(buffer)
        .rotate(rotationMap[fileName])
        .removeAlpha()
        .jpeg({ 
          quality: 80,
          mozjpeg: true,
          force: true
        })
        .toBuffer();

      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: newKey,
        Body: processedBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'orientation': '1'
        },
        ACL: 'public-read'
      });

      await s3Client.send(putCommand);
      const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`;
      console.log(`✅ Fixed rotation for: ${newFileName}`);
      console.log(`📎 URL: ${url}`);
    }

    console.log('🎉 Manual rotation fix complete!');
  } catch (error) {
    console.error('Error fixing rotations:', error);
  }
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

manuallyFixRotation().catch(console.error);