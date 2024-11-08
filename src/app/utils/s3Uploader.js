// src/app/utils/s3Uploader.js
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { s3Client } from './s3Config.js';
import path from 'path';

export async function uploadToS3({ file, albumName, fileName }) {
  try {
    // Get image metadata
    const metadata = await sharp(file).metadata();

    // Only resize if image is larger than 1920px on either dimension
    let imageBuffer = file;
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
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/albums/${albumName}/${fileName}`
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}