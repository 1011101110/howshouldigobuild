import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HowShouldIGo — Smart Transport Recommendations',
  description: 'Get personalized walk, bike, transit, or drive recommendations based on real-time weather and distance.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9fb] text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
