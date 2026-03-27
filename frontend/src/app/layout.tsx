import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Factify',
  description: 'AI destekli bilgi doğrulama asistanı',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className={`${montserrat.className} min-h-screen bg-[#D6EAF8] text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}

