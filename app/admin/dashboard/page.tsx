'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 상단 제목 + 로그아웃 */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">🎛️ 관리자 대시보드</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm"
          >
            로그아웃
          </button>
        </div>

        {/* 기능 카드 섹션 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/dashboard/reports">
            <div className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-xl shadow-md cursor-pointer transition">
              <h2 className="text-xl font-semibold mb-2">🚨 신고 관리</h2>
              <p className="text-sm text-zinc-400">댓글 및 대댓글 신고 내용을 확인하고 처리합니다.</p>
            </div>
          </Link>

          <Link href="/admin/dashboard/songs">
            <div className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-xl shadow-md cursor-pointer transition">
              <h2 className="text-xl font-semibold mb-2">🎵 음악 관리</h2>
              <p className="text-sm text-zinc-400">업로드된 음악을 확인하고 정지/삭제할 수 있습니다.</p>
            </div>
          </Link>

            <Link href="/admin/dashboard/applications">
    <div className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-xl shadow-md cursor-pointer transition">
      <h2 className="text-xl font-semibold mb-2">📩 아티스트 신청서</h2>
      <p className="text-sm text-zinc-400">사용자들이 제출한 신청서를 확인하고 승인할 수 있습니다.</p>
    </div>
  </Link>

          <Link href="/admin/dashboard/users">
            <div className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-xl shadow-md cursor-pointer transition">
              <h2 className="text-xl font-semibold mb-2">🧑‍💼 사용자 관리</h2>
              <p className="text-sm text-zinc-400">사용자를 일시중지하거나 완전 차단할 수 있습니다.</p>
            </div>
          </Link>

          <Link href="/admin/dashboard/contact">
  <div className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-xl shadow-md cursor-pointer transition">
    <h2 className="text-xl font-semibold mb-2">📨 문의 관리</h2>
    <p className="text-sm text-zinc-400">사용자들이 보낸 문의 내용을 확인할 수 있습니다.</p>
  </div>
</Link>

        </div>
      </div>
    </div>
  );
}
