import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Mock Mentor AI - Interview Practice Platform',
  description: 'Practice interviews with AI-powered feedback, adaptive questioning, and personalized insights to ace your next job interview',
  keywords: ['interview practice', 'AI interviewer', 'mock interview', 'job interview prep', 'interview coaching'],
  authors: [{ name: 'Mock Mentor Team' }],
  metadataBase: new URL('https://mockmentor.ai'),
  openGraph: {
    title: 'Mock Mentor AI - Interview Practice Platform',
    description: 'Master your interview skills with AI-powered practice sessions',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/placeholder-logo.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/placeholder-logo.png',
        type: 'image/png',
      }
    ],
    apple: '/placeholder-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
