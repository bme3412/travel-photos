// scripts/create-cloudfront-policy.js
const { 
    IAMClient, 
    CreatePolicyCommand,
    AttachUserPolicyCommand,
    GetUserCommand
  } = require("@aws-sdk/client-iam");
  
  const iamClient = new IAMClient({ region: "us-east-1" });
  
  async function createCloudFrontPolicy() {
    try {
      // Define the policy
      const cloudFrontPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "cloudfront:CreateDistribution",
              "cloudfront:UpdateDistribution",
              "cloudfront:GetDistribution",
              "cloudfront:ListDistributions",
              "cloudfront:DeleteDistribution",
              "cloudfront:CreateCloudFrontOriginAccessIdentity",
              "cloudfront:GetCloudFrontOriginAccessIdentity",
              "cloudfront:DeleteCloudFrontOriginAccessIdentity",
              "cloudfront:ListCloudFrontOriginAccessIdentities",
              "cloudfront:TagResource",
              "cloudfront:UntagResource",
              "cloudfront:ListTagsForResource",
              "s3:GetBucketPolicy",
              "s3:PutBucketPolicy",
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:ListBucket",
              "iam:CreateServiceLinkedRole"
            ],
            Resource: "*"
          }
        ]
      };
  
      // Create the policy
      const createPolicyCommand = new CreatePolicyCommand({
        PolicyName: "CloudFrontFullAccess",
        PolicyDocument: JSON.stringify(cloudFrontPolicy),
        Description: "Allows full access to CloudFront and necessary S3 operations"
      });
  
      console.log('Creating IAM policy...');
      const policyResult = await iamClient.send(createPolicyCommand);
      console.log('Policy created:', policyResult.Policy.Arn);
  
      // Get current user
      const getUserCommand = new GetUserCommand({});
      const userResult = await iamClient.send(getUserCommand);
      const username = userResult.User.UserName;
  
      // Attach policy to user
      const attachPolicyCommand = new AttachUserPolicyCommand({
        UserName: username,
        PolicyArn: policyResult.Policy.Arn
      });
  
      console.log('Attaching policy to user...');
      await iamClient.send(attachPolicyCommand);
      console.log('Policy attached successfully to user:', username);
  
      return policyResult.Policy.Arn;
    } catch (error) {
      if (error.name === 'EntityAlreadyExistsException') {
        console.log('Policy already exists. Proceeding with existing policy...');
      } else {
        console.error('Error creating/attaching policy:', error);
        throw error;
      }
    }
  }
  
  // Run if executed directly
  if (require.main === module) {
    createCloudFrontPolicy()
      .then(() => console.log('Setup complete!'))
      .catch(console.error);
  }
  
  module.exports = createCloudFrontPolicy;