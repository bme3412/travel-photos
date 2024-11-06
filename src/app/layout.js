import './globals.css'
import { Lora } from 'next/font/google'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'Where to next?',
  description: 'Relive your journeys around the world',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={lora.className}>
      <body className="bg-gray-100 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  )
}