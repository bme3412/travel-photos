// src/app/utils/imageHelper.js
const imageHelper = {
    getImageUrl: (path) => {
      if (!path) return '';
      if (path.startsWith('http')) return path;
  
      // Clean the path
      const cleanPath = path
        .replace(/^\/+/, '')
        .replace(/\/+/g, '/')
        .replace(/^images\/albums\//, '')
        .replace(/^albums\//, '');
  
      // Use S3 URL in production, local in development
      if (process.env.NODE_ENV === 'production') {
        return `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/albums/${cleanPath}`;
      }
      
      return `/images/albums/${cleanPath}`;
    },
  
    isS3Enabled: () => {
      return process.env.NODE_ENV === 'production';
    }
  };
  
  export default imageHelper;