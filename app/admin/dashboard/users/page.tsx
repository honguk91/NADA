'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

interface User {
  id: string;
  email: string;
  nickname?: string;
  isArtist?: boolean;
  isAdmin?: boolean;
  suspendedUntil?: string;
  isPermanentlyBanned?: boolean;
  suspensionCount?: number;
  artistLevel?: 'rookie' | 'amateur' | 'pro';
  fanCount?: number; 
}

export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'user' | 'artist' | 'suspended'>('all');
  const [artistLevelFilter, setArtistLevelFilter] = useState<'전체' | 'rookie' | 'amateur' | 'pro' | null>(null);
  const [search, setSearch] = useState('');
  const [openSelectUserId, setOpenSelectUserId] = useState<string | null>(null);
  const [openSuspendMenuId, setOpenSuspendMenuId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const snap = await getDoc(doc(db, 'users', user.uid));
      const isAdmin = snap.data()?.isAdmin === true;
      setIsAdmin(isAdmin);

      if (!isAdmin) {
        router.push('/admin/login');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

useEffect(() => {
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];

    // 🔥 팬 수 포함
    const listWithFanCounts = await Promise.all(
      list.map(async (user) => {
        if (user.isArtist) {
          const fansSnap = await getDocs(collection(db, `users/${user.id}/fans`));
          return {
            ...user,
            fanCount: fansSnap.size,
          };
        } else {
          return user;
        }
      })
    );

    setUsers(listWithFanCounts);
  };

  fetchUsers(); // 비동기 함수 호출
}, []);


  const getUserStatus = (user: User) => {
  if (user.isPermanentlyBanned) return '❌ 영구정지';

  if (user.suspendedUntil) {
    const now = new Date();
    const suspendedUntilDate = new Date(user.suspendedUntil);

    // 🔸 정지 기간이 아직 남아있으면 정지중
    if (now < suspendedUntilDate) {
      return '⏸️ 정지상태';
    } else {
      // 🔸 시간이 지났으면 만료됨
      return '🟡 정지 만료';
    }
  }

  return '✅ 정상';
};

  const handleLevelChange = async (userId: string, newLevel: 'rookie' | 'amateur' | 'pro') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        artistLevel: newLevel,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, artistLevel: newLevel } : u
        )
      );
      setOpenSelectUserId(null);
    } catch (error) {
      console.error('등급 업데이트 실패:', error);
    }
  };

  const handleSuspend = async (user: User, type: '1d' | '3d' | '5d' | 'permanent') => {
    try {
      const userRef = doc(db, 'users', user.id);
      const now = new Date();
      let updates: any = {};
      if (type === 'permanent') {
        updates.isPermanentlyBanned = true;
      } else {
        const days = type === '1d' ? 1 : type === '3d' ? 3 : 5;
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        updates.suspendedUntil = futureDate.toISOString();
        updates.isPermanentlyBanned = false;
      }

      updates.suspensionCount = (user.suspensionCount || 0) + 1;

      await updateDoc(userRef, updates);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                ...updates,
              }
            : u
        )
      );

      setOpenSuspendMenuId(null);
    } catch (error) {
      console.error('정지 실패:', error);
    }
  };
const handlePromoteToAdmin = async (user: User) => {
  const code = prompt("관리자 인증번호를 입력하세요");

  if (code !== "0626") {
    alert("❌ 인증번호가 일치하지 않습니다.");
    return;
  }

  try {
    await updateDoc(doc(db, "users", user.id), { isAdmin: true });
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isAdmin: true } : u))
    );
    alert("✅ 관리자 권한이 부여되었습니다.");
  } catch (err) {
    console.error("관리자 권한 변경 실패:", err);
    alert("오류가 발생했습니다.");
  }
};

const handleDemoteFromAdmin = async (user: User) => {
  const code = prompt("관리자 해제 인증번호를 입력하세요");

  if (code !== "0626") {
    alert("❌ 인증번호가 일치하지 않습니다.");
    return;
  }

  try {
    await updateDoc(doc(db, "users", user.id), { isAdmin: false });
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isAdmin: false } : u))
    );
    alert("✅ 관리자 권한이 해제되었습니다.");
  } catch (err) {
    console.error("관리자 해제 실패:", err);
    alert("오류가 발생했습니다.");
  }
};

  const handleUnsuspend = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        suspendedUntil: null,
        isPermanentlyBanned: false,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                suspendedUntil: undefined,
                isPermanentlyBanned: false,
              }
            : u
        )
      );
    } catch (error) {
      console.error('정지 해제 실패:', error);
    }
  };
  const allCount = users.length;
  const userCount = users.filter((u) => !u.isArtist).length;
  const artistCount = users.filter((u) => u.isArtist).length;
  const suspendedCount = users.filter((u) => u.suspendedUntil || u.isPermanentlyBanned).length;

  const filteredUsers = users.filter((user) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'artist' && user.isArtist) ||
      (filter === 'user' && !user.isArtist) ||
      (filter === 'suspended' && (user.suspendedUntil || user.isPermanentlyBanned));
    const matchesSearch =
      user.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

     const matchesLevel =
    artistLevelFilter === null ||
    artistLevelFilter === '전체' ||
    user.artistLevel === artistLevelFilter;

  return matchesFilter && matchesSearch && matchesLevel;
  });

  if (loading) {
    return <div className="text-white p-10">🔐 관리자 권한 확인 중...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-2xl font-bold mb-6">🧑‍💼 사용자 관리</h1>

      {/* 필터 */}
   <div className="flex gap-4 mb-6">
        {[{ label: `전체 (${allCount})`, value: 'all' },
          { label: `일반 유저 (${userCount})`, value: 'user' },
          { label: `아티스트 유저 (${artistCount})`, value: 'artist' },
          { label: `정지된 유저 (${suspendedCount})`, value: 'suspended' },
        ].map(({ label, value }) => (
         <button
  key={value}
  className={`px-4 py-2 rounded ${filter === value ? 'bg-purple-600' : 'bg-zinc-700'}`}
  onClick={() => {
    setFilter(value as any);
    if (value === 'artist') setArtistLevelFilter('전체');
    else setArtistLevelFilter(null);
  }}
>
  {label}
</button>
        ))}
      </div>

      {/* 검색창 */}
      <input
        type="text"
        placeholder="닉네임 또는 이메일로 검색"
        className="w-full p-3 rounded bg-zinc-800 text-white mb-6"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

{artistLevelFilter && (
  <div className="flex gap-2 mb-6">
   {['전체', 'rookie', 'amateur', 'pro'].map((level) => {
  const count =
    level === '전체'
      ? users.filter((u) => u.isArtist).length
      : users.filter((u) => u.isArtist && u.artistLevel === level).length;

  return (
    <button
      key={level}
      onClick={() => setArtistLevelFilter(level as any)}
      className={`px-4 py-1 rounded ${
        artistLevelFilter === level ? 'bg-purple-600' : 'bg-zinc-700'
      }`}
    >
      {level === '전체' ? `전체 (${count})` : `${level} (${count})`}
    </button>
  );
})}

  </div>
)}

      {/* 유저 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const level = user.artistLevel || 'rookie';
          return (
            <div
              key={user.id}
              className="border border-zinc-700 rounded p-4 bg-zinc-900 relative"
            >
              <p className="text-lg font-semibold">
              {user.nickname || '닉네임 없음'}
              {user.isArtist && user.fanCount !== undefined && (
            <span className="ml-2 text-sm text-zinc-400">👥 팬 {user.fanCount}명</span>
  )}
</p>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <p className="text-sm mt-1">
                유형:{' '}
                {user.isAdmin
                  ? '👑 관리자'
                  : user.isArtist
                  ? `🎤 아티스트 (${level})`
                  : '👤 일반 유저'}
              </p>
              <p className="text-sm text-zinc-400">상태: {getUserStatus(user)}</p>
              <p className="text-sm text-zinc-400">정지 횟수: {user.suspensionCount || 0}</p>

              {/* 등급 변경 */}
             {user.isArtist && (
  <div className="mt-2 flex gap-3 items-center">
    <button
      className="text-sm underline text-purple-400"
      onClick={() =>
        setOpenSelectUserId((prev) => (prev === user.id ? null : user.id))
      }
    >
      등급 변경
    </button>

    {/* ✅ 관리자 지정/해제 버튼 */}
    {user.isAdmin ? (
      <button
        className="text-sm text-red-400 underline"
        onClick={() => handleDemoteFromAdmin(user)}
      >
        관리자 해제
      </button>
    ) : (
      <button
        className="text-sm text-yellow-400 underline"
        onClick={() => handlePromoteToAdmin(user)}
      >
        관리자 지정
      </button>
    )}

    {openSelectUserId === user.id && (
      <div className="mt-2 space-y-1">
        {['rookie', 'amateur', 'pro'].map((level) => (
          <button
            key={level}
            onClick={() => handleLevelChange(user.id, level as any)}
            className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-zinc-700"
          >
            {level}
          </button>
        ))}
      </div>
    )}
  </div>
)}


              {/* 정지 및 해제 버튼 */}
              <div className="mt-4 space-y-1">
                <button
                  className="text-sm text-red-400 underline"
                  onClick={() =>
                    setOpenSuspendMenuId((prev) => (prev === user.id ? null : user.id))
                  }
                >
                  정지하기
                </button>
                {openSuspendMenuId === user.id && (
                  <div className="mt-2 space-y-1">
                    <button
                      className="text-sm px-2 py-1 hover:bg-zinc-700 w-full text-left"
                      onClick={() => handleSuspend(user, '1d')}
                    >
                      ⏱ 1일 정지
                    </button>
                    <button
                      className="text-sm px-2 py-1 hover:bg-zinc-700 w-full text-left"
                      onClick={() => handleSuspend(user, '3d')}
                    >
                      ⏱ 3일 정지
                    </button>
                    <button
                      className="text-sm px-2 py-1 hover:bg-zinc-700 w-full text-left"
                      onClick={() => handleSuspend(user, '5d')}
                    >
                      ⏱ 5일 정지
                    </button>
                    <button
                      className="text-sm px-2 py-1 hover:bg-red-800 w-full text-left"
                      onClick={() => handleSuspend(user, 'permanent')}
                    >
                      ❌ 영구 정지
                    </button>
                  </div>
                )}

                {(user.suspendedUntil || user.isPermanentlyBanned) && (
                  <button
                    className="text-sm text-green-400 underline"
                    onClick={() => handleUnsuspend(user)}
                  >
                    🔓 정지 해제
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <p className="text-zinc-500 text-center col-span-3 mt-10">
            🙅‍♂️ 해당 유저가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
