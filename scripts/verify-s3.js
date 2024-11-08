// scripts/verify-s3.js
const { S3Client, GetBucketPolicyCommand, GetBucketCorsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function verifyS3Setup() {
  console.log('🔍 Verifying S3 setup...\n');

  try {
    // Check bucket policy
    console.log('Checking bucket policy...');
    const policyCommand = new GetBucketPolicyCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
    });
    const policyResult = await s3Client.send(policyCommand);
    console.log('✅ Bucket policy exists');
    console.log(JSON.parse(policyResult.Policy));

    // Check CORS
    console.log('\nChecking CORS configuration...');
    const corsCommand = new GetBucketCorsCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
    });
    const corsResult = await s3Client.send(corsCommand);
    console.log('✅ CORS configuration exists');
    console.log(corsResult.CORSRules);

    // List some objects
    console.log('\nListing some objects...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      MaxKeys: 5,
      Prefix: 'albums/'
    });
    const listResult = await s3Client.send(listCommand);
    console.log('✅ Found objects:');
    listResult.Contents.forEach(item => {
      console.log(`- ${item.Key}`);
    });

    // Generate a sample URL
    const sampleKey = listResult.Contents[0]?.Key;
    if (sampleKey) {
      console.log('\nSample URL:');
      console.log(`https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${sampleKey}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.Code === 'NoSuchBucketPolicy') {
      console.error('No bucket policy found - run update-bucket-policy.js');
    }
    if (error.Code === 'NoSuchCORSConfiguration') {
      console.error('No CORS configuration found - run update-cors-config.js');
    }
  }
}

verifyS3Setup();