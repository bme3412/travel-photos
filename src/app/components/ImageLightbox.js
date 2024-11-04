// src/app/components/ImageLightbox.js
'use client';
import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Download,
} from 'lucide-react';

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}) {
  const currentImage = images[currentIndex];

  // Placeholder functions for zoom and download
  const handleZoomIn = () => {
    // Implement zoom in functionality
  };

  const handleZoomOut = () => {
    // Implement zoom out functionality
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = currentImage.caption || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-gray-300"
        aria-label="Close Lightbox"
      >
        <X size={32} />
      </button>

      <button
        onClick={onPrevious}
        className="absolute left-6 text-white hover:text-gray-300"
        aria-label="Previous Image"
      >
        <ChevronLeft size={48} />
      </button>

      <div className="relative max-w-5xl max-h-[85vh]">
        <img
          src={currentImage.url}
          alt={currentImage.caption}
          className="max-h-[85vh] w-auto object-contain rounded-lg shadow-lg"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
          <p className="text-white text-lg font-semibold" id="lightbox-title">
            {currentImage.caption}
          </p>
          <p className="text-gray-300 text-sm">{currentImage.location}</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="absolute right-6 text-white hover:text-gray-300"
        aria-label="Next Image"
      >
        <ChevronRight size={48} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6">
        <button
          onClick={handleZoomIn}
          className="p-3 bg-white/10 rounded-full hover:bg-white/20"
          aria-label="Zoom In"
        >
          <ZoomIn size={24} className="text-white" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-3 bg-white/10 rounded-full hover:bg-white/20"
          aria-label="Zoom Out"
        >
          <ZoomOut size={24} className="text-white" />
        </button>
        <button
          onClick={handleDownload}
          className="p-3 bg-white/10 rounded-full hover:bg-white/20"
          aria-label="Download Image"
        >
          <Download size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
