import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TestFlow Pro',
  description: 'Advanced Test Automation Generator',
  generator: '',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}
