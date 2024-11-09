// app/layout.js
import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export const metadata = {
  title: 'Travel Photo Albums',
  description: 'A collection of travel photographs from around the world',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}