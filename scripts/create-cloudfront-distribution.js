// scripts/create-cloudfront-distribution.js
const { 
    CloudFrontClient, 
    CreateCloudFrontOriginAccessIdentityCommand,
    CreateDistributionCommand 
  } = require("@aws-sdk/client-cloudfront");
  const { 
    S3Client, 
    PutBucketPolicyCommand 
  } = require("@aws-sdk/client-s3");
  
  const cloudfront = new CloudFrontClient({ region: "us-east-1" });
  const s3 = new S3Client({ region: "us-east-1" });
  
  async function createDistribution() {
    try {
      const BUCKET_NAME = 'global-travel';
      const REGION = 'us-east-1';
      
      console.log('Creating CloudFront distribution...');
  
      // 1. Create Origin Access Identity (OAI)
      console.log('Creating Origin Access Identity...');
      const oaiCommand = new CreateCloudFrontOriginAccessIdentityCommand({
        CloudFrontOriginAccessIdentityConfig: {
          CallerReference: Date.now().toString(),
          Comment: `OAI for ${BUCKET_NAME}`
        }
      });
  
      const oaiResponse = await cloudfront.send(oaiCommand);
      const oaiId = oaiResponse.CloudFrontOriginAccessIdentity.Id;
      console.log('Created OAI:', oaiId);
  
      // 2. Update S3 bucket policy with correct format
      console.log('Updating bucket policy...');
      const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontOAIAccess',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com'
            },
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': `arn:aws:cloudfront::${process.env.AWS_ACCOUNT_ID}:distribution/*`
              }
            }
          }
        ]
      };
  
      const policyCommand = new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(bucketPolicy)
      });
  
      await s3.send(policyCommand);
      console.log('Bucket policy updated successfully');
  
      // 3. Create CloudFront distribution
      const distributionParams = {
        DistributionConfig: {
          CallerReference: Date.now().toString(),
          Comment: `Distribution for ${BUCKET_NAME}`,
          DefaultCacheBehavior: {
            AllowedMethods: {
              Quantity: 2,
              Items: ['GET', 'HEAD'],
              CachedMethods: {
                Quantity: 2,
                Items: ['GET', 'HEAD']
              }
            },
            Compress: true,
            DefaultTTL: 86400,
            ForwardedValues: {
              Cookies: { Forward: 'none' },
              QueryString: false,
              Headers: { Quantity: 0 }
            },
            MinTTL: 0,
            MaxTTL: 31536000,
            TargetOriginId: BUCKET_NAME,
            TrustedSigners: { Enabled: false, Quantity: 0 },
            ViewerProtocolPolicy: 'redirect-to-https'
          },
          Enabled: true,
          Origins: {
            Quantity: 1,
            Items: [
              {
                DomainName: `${BUCKET_NAME}.s3.${REGION}.amazonaws.com`,
                Id: BUCKET_NAME,
                S3OriginConfig: {
                  OriginAccessIdentity: `origin-access-identity/cloudfront/${oaiId}`
                }
              }
            ]
          },
          PriceClass: 'PriceClass_All'
        }
      };
  
      const distribution = await cloudfront.send(new CreateDistributionCommand(distributionParams));
      console.log('Created CloudFront distribution:', distribution.Distribution.DomainName);
  
      // Save configuration
      const fs = require('fs');
      const config = {
        distributionId: distribution.Distribution.Id,
        distributionDomain: distribution.Distribution.DomainName,
        oaiId: oaiId
      };
  
      // Save to .env.local
      fs.writeFileSync('.env.local', `NEXT_PUBLIC_CLOUDFRONT_DOMAIN=${distribution.Distribution.DomainName}`);
  
      // Save full config
      fs.writeFileSync('cloudfront-config.json', JSON.stringify(config, null, 2));
  
      console.log('\nSetup complete!');
      console.log('Configuration saved to .env.local and cloudfront-config.json');
  
      return config;
    } catch (error) {
      console.error('Error creating CloudFront distribution:', error);
      throw error;
    }
  }
  
  // Get AWS account ID first, then create distribution
  const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");
  
  async function init() {
    try {
      // Get AWS account ID
      const sts = new STSClient({ region: "us-east-1" });
      const { Account } = await sts.send(new GetCallerIdentityCommand({}));
      process.env.AWS_ACCOUNT_ID = Account;
      console.log('AWS Account ID:', Account);
  
      // Create distribution
      await createDistribution();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  }
  
  if (require.main === module) {
    init();
  }
  
  module.exports = createDistribution;