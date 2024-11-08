// scripts/update-bucket-policy.js
const { S3Client, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${process.env.AWS_BUCKET_NAME}/*`
    }
  ]
};

async function updateBucketPolicy() {
  try {
    console.log('🚀 Updating bucket policy...');
    console.log('Bucket name:', process.env.AWS_BUCKET_NAME);
    
    const command = new PutBucketPolicyCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    });

    await s3Client.send(command);
    console.log('✅ Bucket policy updated successfully');
    
    // Log the applied policy for verification
    console.log('\nApplied policy:');
    console.log(JSON.stringify(bucketPolicy, null, 2));
  } catch (error) {
    console.error('❌ Error updating bucket policy:', error.message);
    if (error.Code === 'InvalidAccessKeyId') {
      console.error('Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    }
    if (error.Code === 'NoSuchBucket') {
      console.error('Bucket not found. Please check your AWS_BUCKET_NAME');
    }
    process.exit(1);
  }
}

// Check for required environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\nPlease add these to your .env file:');
  console.error(`
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1 (optional, defaults to us-east-1)
  `);
  process.exit(1);
}

// Run the update
updateBucketPolicy();