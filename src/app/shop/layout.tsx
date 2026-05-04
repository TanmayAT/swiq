import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Online',
  description: 'Order fresh food online',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f9fafb', position: 'relative' }}>
      {children}
    </div>
  );
}
