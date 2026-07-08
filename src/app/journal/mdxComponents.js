import Image from 'next/image';

const VIDEO_RE = /\.(mp4|mov|webm|m4v)(\?|#|$)/i;

// The component set handed to MDX posts. Prose elements are styled to the
// site's editorial look (narrow reading column, serif headings). Figure and
// Gallery let authors drop in photographs by filename — the resolver (bound
// per post to that trip's photos) turns "IMG_1669.jpg" into a CloudFront URL.
export function createMdxComponents({ resolveImage }) {
  const Figure = ({ src, alt = '', caption, wide = false }) => {
    const url = resolveImage(src);
    if (!url) return null;
    return (
      <figure className={`${wide ? 'max-w-4xl' : 'max-w-2xl'} mx-auto my-10`}>
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-ink/5">
          <Image
            src={url}
            alt={alt || caption || ''}
            fill
            sizes={wide ? '(min-width:1024px) 896px, 100vw' : '(min-width:768px) 672px, 100vw'}
            className="object-cover"
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-[13px] italic text-muted">{caption}</figcaption>
        )}
      </figure>
    );
  };

  const Gallery = ({ srcs = [], caption }) => {
    const list = Array.isArray(srcs) ? srcs : String(srcs).split(',');
    const urls = list.map((s) => resolveImage(String(s).trim())).filter(Boolean);
    if (!urls.length) return null;
    return (
      <figure className="max-w-4xl mx-auto my-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {urls.map((url, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-ink/5">
              <Image src={url} alt="" fill sizes="(min-width:640px) 33vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-[13px] italic text-muted">{caption}</figcaption>
        )}
      </figure>
    );
  };

  const PullQuote = ({ children }) => (
    <blockquote className="max-w-2xl mx-auto my-12 border-l-2 border-accent pl-5 font-display text-2xl leading-snug tracking-tight text-ink/85">
      {children}
    </blockquote>
  );

  // A wide panorama — a panning video clip (autoplay, muted, looped) or a
  // wide still you scroll to explore. Breaks wider than the reading column.
  const Panorama = ({ src, caption, controls = false }) => {
    const url = resolveImage(src);
    if (!url) return null;
    const isVideo = VIDEO_RE.test(src || '') || VIDEO_RE.test(url);
    return (
      <figure className="my-10">
        {isVideo ? (
          <div className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden rounded-xl bg-ink">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={url}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls={controls}
              preload="metadata"
            />
          </div>
        ) : (
          <div className="h-72 sm:h-80 md:h-96 overflow-x-auto overflow-y-hidden rounded-xl bg-ink/5 [scrollbar-width:thin]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={caption || ''}
              draggable={false}
              className="h-full w-auto max-w-none object-cover select-none"
            />
          </div>
        )}
        {caption && (
          <figcaption className="mt-3 text-center text-[13px] italic text-muted">
            {caption}
            {!isVideo && <span className="text-ink/30"> · scroll to explore</span>}
          </figcaption>
        )}
      </figure>
    );
  };

  return {
    h2: (props) => (
      <h2 className="max-w-2xl mx-auto mt-14 mb-4 font-display text-3xl sm:text-4xl tracking-tight leading-tight" {...props} />
    ),
    h3: (props) => (
      <h3 className="max-w-2xl mx-auto mt-10 mb-3 font-display text-2xl tracking-tight" {...props} />
    ),
    p: (props) => (
      <p className="max-w-2xl mx-auto my-5 text-lg leading-[1.75] text-ink/80" {...props} />
    ),
    a: (props) => (
      <a className="text-accent underline underline-offset-2 hover:text-ink transition-colors" {...props} />
    ),
    ul: (props) => (
      <ul className="max-w-2xl mx-auto my-5 list-disc pl-6 text-lg leading-[1.7] text-ink/80 space-y-1.5" {...props} />
    ),
    ol: (props) => (
      <ol className="max-w-2xl mx-auto my-5 list-decimal pl-6 text-lg leading-[1.7] text-ink/80 space-y-1.5" {...props} />
    ),
    blockquote: (props) => (
      <blockquote className="max-w-2xl mx-auto my-8 border-l-2 border-ink/20 pl-5 italic text-ink/70" {...props} />
    ),
    hr: () => <hr className="max-w-2xl mx-auto my-12 border-ink/10" />,
    img: ({ src, alt }) => <Figure src={src} alt={alt} />,
    Figure,
    Gallery,
    PullQuote,
    Panorama,
  };
}
