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