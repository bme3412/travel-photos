// src/app/utils/s3Utils.js
export const getS3Url = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    return `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.amazonaws.com/${cleanPath}`;
  };
  
  export const isS3Url = (url) => {
    if (!url) return false;
    return url.includes('s3.amazonaws.com');
  };
  
  export const convertToS3Url = (localPath) => {
    if (isS3Url(localPath)) return localPath;
    
    // Convert local path to S3 path structure
    const pathWithoutPublic = localPath.replace(/^public\//, '');
    return getS3Url(pathWithoutPublic);
  };