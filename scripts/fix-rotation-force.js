// scripts/fix-rotation-force.js
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
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: 'albums/Guatemala/'
    });

    const { Contents } = await s3Client.send(listCommand);
    console.log(`Found ${Contents.length} files to process...`);

    for (const object of Contents) {
      console.log(`Processing: ${object.Key}`);

      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: object.Key
      });

      const { Body } = await s3Client.send(getCommand);
      const buffer = await streamToBuffer(Body);

      // Get metadata to check orientation
      const metadata = await sharp(buffer).metadata();
      console.log(`Original orientation: ${metadata.orientation}`);

      // Process with explicit rotation
      let sharpInstance = sharp(buffer)
        .removeAlpha()
        .jpeg({ 
          quality: 80,
          mozjpeg: true,
          force: true
        });

      // Force rotation based on metadata
      if (metadata.orientation === 6) {
        sharpInstance = sharpInstance.rotate(90);
      } else if (metadata.orientation === 8) {
        sharpInstance = sharpInstance.rotate(270);
      } else if (metadata.orientation === 3) {
        sharpInstance = sharpInstance.rotate(180);
      }

      const processedBuffer = await sharpInstance.toBuffer();

      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: object.Key,
        Body: processedBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'orientation': '1'
        },
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

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

fixRotation().catch(console.error);