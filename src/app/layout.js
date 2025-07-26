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
              <nav className="flex items-center space-x-6">
                <Link
                  href="/"
                  className="group flex items-center px-3 py-2 text-sm text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 rounded-lg hover:bg-teal-50"
                >
                  <Home className="w-4 h-4 mr-1.5 group-hover:text-teal-600 transition-colors" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/map"
                  className="group flex items-center px-3 py-2 text-sm text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 rounded-lg hover:bg-teal-50"
                >
                  <MapPin className="w-4 h-4 mr-1.5 group-hover:text-teal-600 transition-colors" />
                  <span>Where I&apos;ve Been</span>
                </Link>
                <Link
                  href="/photo-of-the-day"
                  className="group flex items-center px-3 py-2 text-sm text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 rounded-lg hover:bg-teal-50"
                >
                  <Camera className="w-4 h-4 mr-1.5 group-hover:text-teal-600 transition-colors" />
                  <span>Photos</span>
                </Link>
                <Link
                  href="/writing"
                  className="group flex items-center px-3 py-2 text-sm text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 rounded-lg hover:bg-teal-50"
                >
                  <BookOpen className="w-4 h-4 mr-1.5 group-hover:text-teal-600 transition-colors" />
                  <span>Writing</span>
                </Link>
                <Link
                  href="/contact"
                  className="group flex items-center px-3 py-2 text-sm text-gray-700 hover:text-teal-600 font-medium transition-all duration-200 rounded-lg hover:bg-teal-50"
                >
                  <Mail className="w-4 h-4 mr-1.5 group-hover:text-teal-600 transition-colors" />
                  <span>Contact</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow bg-gradient-to-b from-gray-50 to-white">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* About Section */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white mb-6 relative inline-block">
                  About Passport & Ponder
                  <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-teal-500"></span>
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Documenting adventures across continents with a focus on authentic experiences, 
                  local cultures, and the stories that make each destination unique.
                </p>
                <div className="flex space-x-4 mt-6">
                  <span className="inline-block px-3 py-1 bg-teal-600 text-white text-sm rounded-full">
                    🌍 25+ Countries
                  </span>
                  <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-sm rounded-full">
                    📸 500+ Photos
                  </span>
                </div>
              </div>

              {/* Recent Adventures */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white mb-6 relative inline-block">
                  Recent Adventures
                  <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-teal-500"></span>
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                    Portugal: Coastal gems and historic cities
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                    Japan: Cherry blossoms and cultural immersion
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                    Iceland: Fire, ice, and Nordic landscapes
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
                  Share your own travel experiences or get in touch for collaborations. Let&apos;s explore together!
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
        <Analytics />
      </body>
    </html>
  );
}