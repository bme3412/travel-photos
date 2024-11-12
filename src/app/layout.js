import './globals.css';
import Link from 'next/link';
import { MapPin, Camera, BookOpen, Mail, Home } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: '🛫 Passport & Ponder 🌎',
  description: '🌍 Exploring the world, one story at a time ✏️',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        {/* Header Section */}
        <header className="bg-white shadow-lg sticky top-0 z-50 transition-shadow duration-300">
          <div className="max-w-7xl mx-auto px-6">
            {/* Logo and Title Section */}
            <div className="text-center py-10">
              <Link href="/" className="inline-block group">
                <h1 className="text-6xl font-extrabold text-gray-900 mb-3 tracking-tight group-hover:text-teal-600 transition-all duration-300 ease-in-out">
                  🌎 Passport & Ponder 🛫
                </h1>
                <p className="text-lg text-gray-600 font-medium tracking-wide transform transition-all duration-300 group-hover:text-teal-600">
                  Exploring the world, one two-week trip at a time
                </p>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex justify-center space-x-12 border-t border-b border-gray-100">
              <Link
                href="/"
                className="group flex items-center px-6 py-6 text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-600 -mt-[1px] relative"
              >
                <Home className="w-5 h-5 mr-2 group-hover:text-teal-600 transition-colors" />
                <span className="relative">
                  Home
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
              <Link
                href="/map"
                className="group flex items-center px-6 py-6 text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-600 -mt-[1px] relative"
              >
                <MapPin className="w-5 h-5 mr-2 group-hover:text-teal-600 transition-colors" />
                <span className="relative">
                  Where I've Been
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
              <Link
                href="/photo-of-the-day"
                className="group flex items-center px-6 py-6 text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-600 -mt-[1px] relative"
              >
                <Camera className="w-5 h-5 mr-2 group-hover:text-teal-600 transition-colors" />
                <span className="relative">
                  Photo of the Day
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
              <Link
                href="/writing"
                className="group flex items-center px-6 py-6 text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-600 -mt-[1px] relative"
              >
                <BookOpen className="w-5 h-5 mr-2 group-hover:text-teal-600 transition-colors" />
                <span className="relative">
                  Writing
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
              <Link
                href="/contact"
                className="group flex items-center px-6 py-6 text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-600 -mt-[1px] relative"
              >
                <Mail className="w-5 h-5 mr-2 group-hover:text-teal-600 transition-colors" />
                <span className="relative">
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow bg-gradient-to-b from-gray-50 to-white">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* About Section */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white mb-6 relative inline-block">
                  About
                  <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-teal-500"></span>
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Documenting my journey around the world through photographs and stories.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white mb-6 relative inline-block">
                  Quick Links
                  <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-teal-500"></span>
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/map" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Interactive Map
                    </Link>
                  </li>
                  <li>
                    <Link href="/albums" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center">
                      <Camera className="w-4 h-4 mr-2" />
                      Photo Albums
                    </Link>
                  </li>
                  <li>
                    <Link href="/stories" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Travel Stories
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Connect Section */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white mb-6 relative inline-block">
                  Connect
                  <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-teal-500"></span>
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Share your own travel experiences or get in touch for collaborations. Let's explore together!
                </p>
                <Link
                  href="/contact"
                  className="inline-block mt-6 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-300 transform hover:scale-105"
                >
                  Get in Touch
                </Link>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p className="text-sm">&copy; {new Date().getFullYear()} 🛫 Passport & Ponder 🌎 | All rights reserved</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}