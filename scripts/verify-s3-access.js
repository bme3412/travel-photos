// scripts/verify-s3-access.js
const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function verifyS3Access() {
  try {
    console.log('🔍 Verifying S3 access...');

    // List objects in the albums folder
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: 'albums/',
      MaxKeys: 5
    });

    const listResult = await s3Client.send(listCommand);
    
    console.log('\n📁 Found images:');
    for (const item of listResult.Contents || []) {
      console.log(`- ${item.Key}`);
      console.log(`  URL: https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`);
    }

    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyS3Access();