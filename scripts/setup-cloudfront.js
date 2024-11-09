// scripts/setup-cloudfront.js
const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront();
const s3 = new AWS.S3();

async function setupCloudFront() {
  try {
    // Get the bucket configuration
    const bucketName = 'global-travel';
    const region = 'us-east-1';
    const bucketDomain = `${bucketName}.s3.${region}.amazonaws.com`;

    // Create Origin Access Identity (OAI)
    const oaiResult = await cloudfront.createCloudFrontOriginAccessIdentity({
      CloudFrontOriginAccessIdentityConfig: {
        Comment: `OAI for ${bucketName} bucket`
      }
    }).promise();

    const oaiId = oaiResult.CloudFrontOriginAccessIdentity.Id;

    // Update bucket policy to allow CloudFront access
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: {
          AWS: `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${oaiId}`
        },
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`
      }]
    };

    await s3.putBucketPolicy({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    }).promise();

    // Create CloudFront distribution
    const distributionConfig = {
      DistributionConfig: {
        CallerReference: Date.now().toString(),
        Comment: `Distribution for ${bucketName}`,
        DefaultCacheBehavior: {
          ForwardedValues: {
            Cookies: { Forward: 'none' },
            QueryString: false
          },
          MinTTL: 0,
          TargetOriginId: bucketDomain,
          TrustedSigners: { Enabled: false, Quantity: 0 },
          ViewerProtocolPolicy: 'redirect-to-https',
          DefaultTTL: 86400, // 24 hours
          MaxTTL: 31536000,  // 1 year
          Compress: true
        },
        Enabled: true,
        Origins: {
          Quantity: 1,
          Items: [{
            DomainName: bucketDomain,
            Id: bucketDomain,
            S3OriginConfig: {
              OriginAccessIdentity: `origin-access-identity/cloudfront/${oaiId}`
            }
          }]
        },
        DefaultRootObject: '',
        HttpVersion: 'http2',
        IsIPV6Enabled: true,
        PriceClass: 'PriceClass_All'
      }
    };

    const distribution = await cloudfront.createDistribution(distributionConfig).promise();
    console.log('CloudFront Distribution created:', distribution.Distribution.DomainName);
    
    // Save the distribution ID and domain to a config file
    const fs = require('fs');
    fs.writeFileSync('./src/config/cloudfront.json', JSON.stringify({
      distributionId: distribution.Distribution.Id,
      domain: distribution.Distribution.DomainName
    }, null, 2));

  } catch (error) {
    console.error('Error setting up CloudFront:', error);
    throw error;
  }
}

setupCloudFront();