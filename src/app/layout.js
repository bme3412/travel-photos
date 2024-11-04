// src/app/layout.js
import './globals.css';
import { Lora } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'Where to go next?',
  description: 'Relive your journeys around the world',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${lora.className} bg-gray-100 text-gray-800`}>
        {children}
      </body>
    </html>
  );
}
