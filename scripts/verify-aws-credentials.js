// scripts/verify-aws-credentials.js
const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

async function verifyCredentials() {
  try {
    console.log('Checking AWS credentials...');
    
    // Create STS client
    const sts = new STSClient({ region: "us-east-1" });
    
    // Get caller identity to verify credentials
    const command = new GetCallerIdentityCommand({});
    const response = await sts.send(command);
    
    console.log('AWS Credentials are valid!');
    console.log('Account:', response.Account);
    console.log('User ARN:', response.Arn);
    
    return true;
  } catch (error) {
    console.error('AWS Credentials are invalid or missing!');
    console.error('Error details:', error.message);
    console.log('\nTo fix this:');
    console.log('1. Go to AWS Console -> IAM -> Users -> Your User -> Security credentials');
    console.log('2. Create new access key or use existing one');
    console.log('3. Run the following commands:');
    console.log('\n   export AWS_ACCESS_KEY_ID=your_access_key');
    console.log('   export AWS_SECRET_ACCESS_KEY=your_secret_key\n');
    console.log('   Or configure using aws cli:');
    console.log('   aws configure\n');
    return false;
  }
}

// Run verification if this script is run directly
if (require.main === module) {
  verifyCredentials();
}

module.exports = verifyCredentials;