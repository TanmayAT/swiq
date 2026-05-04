import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swiq — Smart Restaurant Management",
  description: "Smart tools for smart restaurant owners.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" style={{ colorScheme: 'light', background: '#f0fdf4' }}>
      <body style={{ background: '#f0fdf4', color: '#0f2817', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
