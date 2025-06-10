// hooks/useAdminGuard.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function useAdminGuard() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!currentUser || !userData?.admin) {
      alert('관리자만 접근할 수 있습니다.');
      router.replace('/');
    }
  }, [currentUser, userData, loading, router]);
}
