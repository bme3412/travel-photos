// scripts/fix-rotation.js
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

async function fixRotation() {
  try {
    // List all objects in the Guatemala folder
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: 'albums/Guatemala/'
    });

    const { Contents } = await s3Client.send(listCommand);

    console.log(`Found ${Contents.length} files to process...`);

    for (const object of Contents) {
      console.log(`Processing: ${object.Key}`);

      // Get the image
      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: object.Key
      });

      const { Body } = await s3Client.send(getCommand);
      const buffer = await streamToBuffer(Body);

      // Process with sharp
      const processedBuffer = await sharp(buffer)
        .rotate()
        .withMetadata()
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();

      // Upload back to S3
      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: object.Key,
        Body: processedBuffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      });

      await s3Client.send(putCommand);
      console.log(`✅ Fixed rotation for: ${object.Key}`);
    }

    console.log('🎉 Rotation fix complete!');
  } catch (error) {
    console.error('Error fixing rotations:', error);
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

fixRotation().catch(console.error);