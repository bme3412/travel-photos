// scripts/update-cors-config.js
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3000',
        'https://*.vercel.app',
        process.env.NEXT_PUBLIC_SITE_URL || '*'
      ],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600
    }
  ]
};

async function updateCorsConfig() {
  try {
    console.log('🚀 Updating CORS configuration...');
    
    const command = new PutBucketCorsCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    });

    await s3Client.send(command);
    console.log('✅ CORS configuration updated successfully');
    
    console.log('\nApplied CORS configuration:');
    console.log(JSON.stringify(corsConfiguration, null, 2));
  } catch (error) {
    console.error('❌ Error updating CORS configuration:', error.message);
    process.exit(1);
  }
}

// Run the update
updateCorsConfig();