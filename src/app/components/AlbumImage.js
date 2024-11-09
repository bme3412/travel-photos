// src/app/components/AlbumImage.js
const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd1mnon53ja4k10.cloudfront.net';
const S3_DOMAIN = 's3.us-east-1.amazonaws.com';
const BUCKET_NAME = 'global-travel';

const getImageUrl = (path) => {
  if (!path) {
    console.error('No path provided to getImageUrl');
    return '';
  }

  let cleanPath = path;
  
  // If it's a full S3 URL, extract just the path portion
  if (path.includes(S3_DOMAIN)) {
    // Extract path after the bucket name
    const pathMatch = path.match(new RegExp(`${BUCKET_NAME}/(.*)`));
    if (pathMatch && pathMatch[1]) {
      cleanPath = pathMatch[1];
    }
  }

  // Clean up the path
  cleanPath = cleanPath
    .replace(/\.HEIC$/i, '.jpg')
    .replace(/^\/?(images\/)?albums\//, '')
    .replace(/\/+/g, '/');

  const url = `https://${CLOUDFRONT_DOMAIN}/albums/${cleanPath}`;
  console.log('Generated CloudFront URL:', url);
  return url;
};