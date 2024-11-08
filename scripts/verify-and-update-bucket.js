// scripts/verify-and-update-bucket.js
const { S3Client, PutBucketPolicyCommand, PutBucketCorsCommand, PutPublicAccessBlockCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Update public access block settings
async function updatePublicAccessBlock() {
  try {
    const command = new PutPublicAccessBlockCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    });
    await s3Client.send(command);
    console.log('✅ Public access block settings updated');
  } catch (error) {
    console.error('Error updating public access block:', error);
    throw error;
  }
}

// Update bucket policy
async function updateBucketPolicy() {
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: [
          's3:GetObject'
        ],
        Resource: [
          `arn:aws:s3:::${process.env.AWS_BUCKET_NAME}/*`
        ]
      }
    ]
  };

  try {
    const command = new PutBucketPolicyCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    });
    await s3Client.send(command);
    console.log('✅ Bucket policy updated');
  } catch (error) {
    console.error('Error updating bucket policy:', error);
    throw error;
  }
}

// Update CORS configuration
async function updateCors() {
  const corsConfig = {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'HEAD'],
        AllowedOrigins: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600
      }
    ]
  };

  try {
    const command = new PutBucketCorsCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      CORSConfiguration: corsConfig
    });
    await s3Client.send(command);
    console.log('✅ CORS configuration updated');
  } catch (error) {
    console.error('Error updating CORS:', error);
    throw error;
  }
}

async function updateBucketConfiguration() {
  try {
    console.log('🚀 Starting bucket configuration update...');
    await updatePublicAccessBlock();
    await updateBucketPolicy();
    await updateCors();
    console.log('✨ Bucket configuration complete!');
  } catch (error) {
    console.error('❌ Configuration failed:', error);
    process.exit(1);
  }
}

updateBucketConfiguration();