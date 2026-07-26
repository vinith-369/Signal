"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/chat');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121316', color: '#fff' }}>
      Loading...
    </div>
  );
}
