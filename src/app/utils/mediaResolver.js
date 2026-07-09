import { transformToCloudFront } from './imageUtils';

// A filename substring ("IMG_1669.jpg", "clip.mp4") or full URL -> CloudFront
// URL, resolved against a trip's photos and (optionally) videos. Used by both
// the journal dispatch (MDX <Figure>/<Gallery>) and the scene-based trip replay
// so photos can be referenced by filename in authored content.
export function buildMediaResolver(rawPhotos, videos) {
  return (ref) => {
    if (!ref) return null;
    if (/^https?:\/\//.test(ref)) return ref;
    const photo = rawPhotos.find((p) => p.url && p.url.includes(ref));
    if (photo) return transformToCloudFront(photo.url);
    const video = (videos || []).find((v) => v.file === ref || (v.url && v.url.includes(ref)));
    if (video) return transformToCloudFront(video.url);
    return null;
  };
}
