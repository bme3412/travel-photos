// src/app/utils/imageHelper.js

/**
 * Transforms S3 URLs to CloudFront URLs and ensures proper URL formatting
 * @param {string} url - The original image URL (S3 or CloudFront)
 * @returns {string} - The transformed CloudFront URL
 */
export const getCloudFrontUrl = (url) => {
    if (!url) return '';
    
    // Extract the path from the S3 URL
    const s3Pattern = /global-travel\.s3\.us-east-1\.amazonaws\.com\/(.*)/;
    const cloudFrontPattern = /d1mnon53ja4k10\.cloudfront\.net\/(.*)/;
    
    let imagePath;
    
    if (url.includes('global-travel.s3.us-east-1.amazonaws.com')) {
      imagePath = url.match(s3Pattern)?.[1];
    } else if (url.includes('d1mnon53ja4k10.cloudfront.net')) {
      imagePath = url.match(cloudFrontPattern)?.[1];
    } else {
      imagePath = url;
    }
    
    // Ensure the path is properly encoded
    const encodedPath = encodeURI(imagePath || '').replace(/%20/g, '+');
    
    // Construct the CloudFront URL
    return `https://d1mnon53ja4k10.cloudfront.net/${encodedPath}`;
  };
  
  /**
   * Generates srcSet for responsive images through CloudFront
   * @param {string} url - The original image URL
   * @returns {string} - The srcSet string for responsive images
   */
  export const getCloudFrontSrcSet = (url) => {
    const baseUrl = getCloudFrontUrl(url);
    const widths = [640, 750, 828, 1080, 1200, 1920];
    
    return widths
      .map(width => `${baseUrl}?w=${width} ${width}w`)
      .join(', ');
  };