// scripts/verify-permissions.js
const { CloudFrontClient, ListDistributionsCommand } = require("@aws-sdk/client-cloudfront");
const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3");

async function verifyPermissions() {
  try {
    console.log('Verifying permissions...');
    
    // Test CloudFront access
    console.log('Testing CloudFront access...');
    const cloudfront = new CloudFrontClient({ region: "us-east-1" });
    await cloudfront.send(new ListDistributionsCommand({}));
    console.log('✅ CloudFront access verified');
    
    // Test S3 access
    console.log('Testing S3 access...');
    const s3 = new S3Client({ region: "us-east-1" });
    await s3.send(new ListObjectsCommand({ Bucket: 'global-travel' }));
    console.log('✅ S3 access verified');
    
    console.log('All permissions verified successfully!');
    return true;
  } catch (error) {
    console.error('❌ Permission verification failed:');
    console.error(error.message);
    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  verifyPermissions()
    .then(success => {
      if (!success) process.exit(1);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = verifyPermissions;