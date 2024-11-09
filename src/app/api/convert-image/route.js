import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'edge';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const { imagePath } = await request.json();

    // Get image from S3
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imagePath
    });

    const { Body } = await s3Client.send(getCommand);
    
    // Convert stream to array buffer
    const response = new Response(Body);
    const arrayBuffer = await response.arrayBuffer();
    
    // Create a new key for the processed image
    const newKey = imagePath.replace(/\.[^.]+$/, '.jpg');
    
    // Upload back to S3
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: newKey,
      Body: arrayBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    });

    await s3Client.send(putCommand);

    return NextResponse.json({
      success: true,
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`
    });
  } catch (error) {
    console.error('Image conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert image' },
      { status: 500 }
    );
  }
}