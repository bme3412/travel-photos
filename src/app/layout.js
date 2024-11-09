import './globals.css';
import Link from 'next/link';
import { MapPin, Camera, BookOpen, Mail, Home } from 'lucide-react';

export const metadata = {
  title: 'Passport & Ponder',
  description: 'Exploring the world, one story at a time',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {/* Header Section */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6">
            {/* Logo and Title Section */}
            <div className="text-center py-8">
              <Link href="/" className="inline-block">
                <h1 className="text-5xl font-extrabold text-gray-800 mb-2 hover:text-teal-700 transition-colors">
                  Passport & Ponder
                </h1>
                <p className="text-lg text-gray-600">
                  Exploring the world, one story at a time
                </p>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex justify-center space-x-8 border-t border-b border-gray-200">
              <Link
                href="/"
                className="group flex items-center px-4 py-5 text-gray-700 hover:text-teal-700 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-700 -mt-[1px]"
              >
                <Home className="w-5 h-5 mr-2 group-hover:text-teal-700 transition-colors" />
                Home
              </Link>
              <Link
                href="/map"
                className="group flex items-center px-4 py-5 text-gray-700 hover:text-teal-700 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-700 -mt-[1px]"
              >
                <MapPin className="w-5 h-5 mr-2 group-hover:text-teal-700 transition-colors" />
                Where I've Been
              </Link>
              <Link
                href="/albums"
                className="group flex items-center px-4 py-5 text-gray-700 hover:text-teal-700 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-700 -mt-[1px]"
              >
                <Camera className="w-5 h-5 mr-2 group-hover:text-teal-700 transition-colors" />
                Photo of the Day
              </Link>
              <Link
                href="/stories"
                className="group flex items-center px-4 py-5 text-gray-700 hover:text-teal-700 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-700 -mt-[1px]"
              >
                <BookOpen className="w-5 h-5 mr-2 group-hover:text-teal-700 transition-colors" />
                Stories
              </Link>
              <Link
                href="/contact"
                className="group flex items-center px-4 py-5 text-gray-700 hover:text-teal-700 font-medium transition-all duration-200 hover:border-t-2 hover:border-teal-700 -mt-[1px]"
              >
                <Mail className="w-5 h-5 mr-2 group-hover:text-teal-700 transition-colors" />
                Contact
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow bg-gray-50">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* About Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4">About</h3>
                <p className="text-gray-300">
                  Documenting my journey around the world through photographs and stories.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/map" className="text-gray-300 hover:text-teal-400 transition-colors">
                      Interactive Map
                    </Link>
                  </li>
                  <li>
                    <Link href="/albums" className="text-gray-300 hover:text-teal-400 transition-colors">
                      Photo Albums
                    </Link>
                  </li>
                  <li>
                    <Link href="/stories" className="text-gray-300 hover:text-teal-400 transition-colors">
                      Travel Stories
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Connect Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Connect</h3>
                <p className="text-gray-300">
                  Share your own travel experiences or get in touch for collaborations.
                </p>
                <Link
                  href="/contact"
                  className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                >
                  Get in Touch
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} Passport & Ponder. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}