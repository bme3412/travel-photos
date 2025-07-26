import React from 'react';
import { Camera } from 'lucide-react';

const LoadingPhotoPreview = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "w-16 h-16",
    md: "w-20 h-20", 
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9", 
    xl: "h-12 w-12"
  };
  
  return (
    <div className={`relative overflow-hidden rounded-xl shadow-lg group ${sizes[size]} ${className}`}>
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 animate-pulse" />
      
      {/* Multiple shimmer layers for depth */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"
        style={{
          animation: 'shimmer 2s ease-in-out infinite',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
          transform: 'translateX(-100%)',
        }}
      />
      
      {/* Secondary shimmer for added effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/40 to-transparent animate-shimmer-secondary"
        style={{
          animation: 'shimmer-secondary 2.5s ease-in-out infinite 0.5s',
          background: 'linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.4), transparent)',
          transform: 'translateX(-100%)',
        }}
      />
      
      {/* Enhanced camera icon with background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="p-3 bg-white/80 rounded-xl shadow-md group-hover:bg-white/90 transition-all duration-300 group-hover:scale-110">
          <Camera className={`${iconSizes[size]} text-gray-500 group-hover:text-blue-600 transition-colors duration-300`} />
        </div>
      </div>
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5" />
      
      {/* CSS for enhanced animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes shimmer-secondary {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-shimmer-secondary {
          animation: shimmer-secondary 2.5s ease-in-out infinite 0.5s;
        }
      `}</style>
    </div>
  );
};

export default LoadingPhotoPreview; 