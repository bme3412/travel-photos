// src/app/layout.js

import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Global Travel Photos',
  description: 'Explore destinations through my curated photo collection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Header Section */}
        <header className="bg-white shadow-md p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo or Site Title */}
            <Link href="/" className="text-2xl font-bold text-gray-800">
              Global Travel
            </Link>

            {/* Navigation Links */}
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-teal-700 font-medium">
                Home
              </Link>
              <Link href="/map" className="text-gray-700 hover:text-teal-700 font-medium">
                Where I've Been
              </Link>
              {/* Add more links as needed */}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer (Optional) */}
        <footer className="bg-gray-800 text-white p-4 text-center">
          &copy; {new Date().getFullYear()} Global Travel. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
