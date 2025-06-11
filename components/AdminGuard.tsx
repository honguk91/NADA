'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const isAdmin = userDoc.exists() && userDoc.data().isAdmin;

      if (isAdmin) {
        setIsAuthorized(true);
      } else {
        router.push('/admin/login');
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  // 로그인 페이지는 예외 처리 (누구나 접근 가능)
  if (pathname.includes('/admin/login')) {
    return <>{children}</>;
  }

  // 로딩 중이면 중앙 정렬된 로딩 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">로딩 중...</p>
      </div>
    );
  }

  // 관리자만 children 렌더링
  return isAuthorized ? <>{children}</> : null;
}
