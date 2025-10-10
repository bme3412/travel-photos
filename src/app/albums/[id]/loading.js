import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-teal-600 hover:text-teal-700 transition-colors duration-200 group"
              >
                <ArrowLeft className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform duration-200" />
              </Link>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i}
              className="relative aspect-[3/2] rounded-xl overflow-hidden bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

