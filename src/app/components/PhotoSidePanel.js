import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import Image from 'next/image';
import { transformToCloudFront } from '../utils/imageUtils';

const PhotoSidePanel = ({ location, isOpen, onClose, onPhotoClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const sortedPhotos = useMemo(() => 
    location?.photos?.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) || [],
    [location?.photos]
  );

  const navigatePhotos = (direction) => {
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % sortedPhotos.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    }
  };

  if (!location || !isOpen) return null;

  return (
    <>
      {/* Enhanced Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Enhanced Side Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[28rem] bg-white shadow-2xl z-50 transform transition-all duration-500 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Enhanced Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 pr-4 leading-tight">
              {location.name}
            </h2>
            <button
              onClick={onClose}
              className="group p-3 hover:bg-white/80 rounded-xl transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <X className="h-6 w-6 text-gray-500 group-hover:text-gray-700 transition-colors duration-300" />
            </button>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/70 rounded-lg">
                <Camera className="h-5 w-5 text-teal-600" />
              </div>
              <span className="font-semibold text-teal-700">{sortedPhotos.length} photos</span>
            </div>
            {sortedPhotos[0]?.dateCreated && (
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100/70 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium">{new Date(sortedPhotos[0].dateCreated).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Main Photo Display */}
        {sortedPhotos.length > 0 && (
          <div className="relative h-80 bg-gradient-to-br from-gray-100 to-gray-200 border-b border-gray-200">
            <Image
              src={transformToCloudFront(sortedPhotos[currentImageIndex].url)}
              alt={sortedPhotos[currentImageIndex].caption || 'Photo'}
              fill
              className="object-cover"
              sizes="448px"
            />
            
            {/* Enhanced Photo Navigation */}
            {sortedPhotos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhotos('prev')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigatePhotos('next')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                
                {/* Enhanced Photo Counter */}
                <div className="absolute bottom-4 right-4 px-4 py-2 bg-black/60 text-white text-sm font-medium rounded-xl backdrop-blur-sm">
                  {currentImageIndex + 1} / {sortedPhotos.length}
                </div>
              </>
            )}
            
            {/* Enhanced Photo Caption */}
            {sortedPhotos[currentImageIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <p className="text-white text-sm font-medium leading-relaxed">
                  {sortedPhotos[currentImageIndex].caption}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Photo Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
              <Camera className="h-5 w-5 text-teal-600" />
            </div>
            All Photos ({sortedPhotos.length})
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {sortedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'ring-3 ring-teal-500 shadow-xl scale-105' 
                    : 'hover:scale-105 hover:shadow-lg shadow-md'
                }`}
                onClick={() => {
                  setCurrentImageIndex(index);
                  if (onPhotoClick) {
                    onPhotoClick({ ...photo, index });
                  }
                }}
              >
                <Image
                  src={transformToCloudFront(photo.url)}
                  alt={photo.caption || 'Photo'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 50vw, 224px"
                />
                
                {/* Enhanced Overlay for current photo */}
                {index === currentImageIndex && (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/30 to-cyan-500/30 border-3 border-teal-500 rounded-xl flex items-center justify-center">
                    <div className="p-3 bg-white/90 rounded-xl">
                      <Camera className="h-6 w-6 text-teal-600" />
                    </div>
                  </div>
                )}
                
                {/* Enhanced Date overlay */}
                {photo.dateCreated && (
                  <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-lg backdrop-blur-sm">
                    {new Date(photo.dateCreated).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Enhanced Empty State */}
          {sortedPhotos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl inline-block mb-4">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-lg font-medium">No photos available for this location</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PhotoSidePanel; 