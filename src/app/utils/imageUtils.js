// src/app/utils/imageUtils.js
export const transformToCloudFront = (url) => {
    if (!url) return '';
    const path = url
      .replace('https://global-travel.s3.us-east-1.amazonaws.com/', '')
      .replace('https://d1mnon53ja4k10.cloudfront.net/', '')
      .replace(/\.HEIC$/i, '.jpg');
    return `https://d1mnon53ja4k10.cloudfront.net/${path}`;
  };