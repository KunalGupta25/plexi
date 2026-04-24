import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/components/sidebar-context'
import { Sidebar } from '@/components/sidebar'
import { MainContent } from '@/components/main-content'
import { PWARegister } from '@/components/pwa-register'
import { ReleaseNotesPopup } from '@/components/release-notes-popup'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Plexi - AI Study Hub',
  description: 'Your Study Material, Supercharged by AI. Access notes, presentations, and AI-powered study assistance all in one place.',
  generator: 'Plexi',
  manifest: '/manifest.webmanifest',
  keywords: ['study', 'AI', 'education', 'notes', 'learning', 'study hub'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1f' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-background">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <Sidebar />
            <MainContent>{children}</MainContent>
          </SidebarProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <PWARegister />
        <ReleaseNotesPopup />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
