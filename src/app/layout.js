import './globals.css';
import Link from 'next/link';
import { MapPin, Camera, Home } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: '🛫 Passport & Ponder 🌎',
  description: '🌍 Exploring the world, one story at a time ✏️',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        {/* Compact Header Section */}
        <header className="bg-white shadow-sm sticky top-0 z-50 transition-shadow duration-300" style={{ zIndex: 50 }}>
          <div className="max-w-7xl mx-auto px-4">
            {/* Compact Logo and Navigation Row */}
            <div className="flex items-center justify-between py-3">
              {/* Compact Logo */}
              <Link href="/" className="group flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-teal-600 transition-colors duration-300">
                  🌎 Passport & Ponder
                </h1>
              </Link>

              {/* Compact Navigation Links */}
              <nav className="flex items-center space-x-3">
                <Link
                  href="/"
                  className="group flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/map"
                  className="group flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Where I&apos;ve Been</span>
                </Link>
                <Link
                  href="/photo-of-the-day"
                  className="group flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  <span>Photo of the Day</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow bg-gradient-to-b from-gray-50 to-white">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Passport & Ponder
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}