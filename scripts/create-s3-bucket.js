import { 
    S3Client, 
    CreateBucketCommand,
    PutBucketCorsCommand,
    PutBucketPolicyCommand,
    PutPublicAccessBlockCommand 
  } from '@aws-sdk/client-s3';
  import { fileURLToPath } from 'url';
  import { dirname } from 'path';
  import * as dotenv from 'dotenv';
  
  // Load environment variables
  dotenv.config();
  
  // Get current file path (ESM equivalent of __dirname)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  const s3Client = new S3Client({
    region: 'us-east-1', // Change this to your desired region
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  
  const BUCKET_NAME = 'global-travel'; // Change this to your desired bucket name
  
  async function createPhotosBucket() {
    try {
      // 1. Create the bucket
      await s3Client.send(new CreateBucketCommand({
        Bucket: BUCKET_NAME,
      }));
      console.log('✅ Bucket created successfully');
  
      // 2. Configure CORS for web access
      await s3Client.send(new PutBucketCorsCommand({
        Bucket: BUCKET_NAME,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: ['*'],  // Replace with your domain in production
              ExposeHeaders: ['ETag']
            }
          ]
        }
      }));
      console.log('✅ CORS configuration applied');
  
      // 3. Configure public access block settings
      await s3Client.send(new PutPublicAccessBlockCommand({
        Bucket: BUCKET_NAME,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: false,
          BlockPublicPolicy: false,
          IgnorePublicAcls: false,
          RestrictPublicBuckets: false
        }
      }));
      console.log('✅ Public access block settings configured');
  
      // 4. Set bucket policy for public read access
      const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
  
      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(bucketPolicy)
      }));
      console.log('✅ Bucket policy applied');
  
      console.log('✨ Bucket setup complete!');
    } catch (error) {
      console.error('❌ Error creating bucket:', error);
    }
  }
  
  createPhotosBucket();