import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crypto Mining Game',
  description: 'A fun crypto mining simulation game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
