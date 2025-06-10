'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GuiltyReport {
  id: string;
  reason: string;
  reporterNickname: string;
  reportedUserNickname: string;
  createdAt: any;
  type?: string;
  postContentSnapshot?: string;
  postImageSnapshot?: string;
  commentContentSnapshot?: string;
  commentNicknameSnapshot?: string;
  reportedUserId?: string;
}

interface SuspendedUser {
  id: string;
  nickname: string;
  suspendedUntil: any;
  suspensionCount: number;
}

export default function GuiltyReportList() {
  const [reports, setReports] = useState<GuiltyReport[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [guiltyCounts, setGuiltyCounts] = useState<{ [userId: string]: number }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (filter === 'user') {
        const q = query(collection(db, 'users'), where('suspendedUntil', '!=', null));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          nickname: doc.data().nickname,
          suspendedUntil: doc.data().suspendedUntil,
          suspensionCount: doc.data().suspensionCount || 0,
        })) as SuspendedUser[];
        setSuspendedUsers(list);
      } else {
        const snapshot = await getDocs(collection(db, 'guiltyReports'));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as GuiltyReport[];
        setReports(list);

        // 유죄 횟수 계산
        const countMap: { [userId: string]: number } = {};
        list.forEach((r) => {
          const uid = r.reportedUserId;
          if (uid) {
            countMap[uid] = (countMap[uid] || 0) + 1;
          }
        });
        setGuiltyCounts(countMap);
      }
    };
    fetchData();
  }, [filter]);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'guiltyReports', id));
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUnban = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), {
      suspendedUntil: null,
    });
    setSuspendedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handlePermanentSuspend = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        suspendedUntil: 'permanent',
      });
      setSuspendedUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, suspendedUntil: 'permanent' } : u
        )
      );
    } catch (error) {
      console.error('❌ 영구정지 실패:', error);
      alert('영구정지 처리 중 오류가 발생했습니다.');
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'post' && report.postContentSnapshot) ||
      (filter === 'comment' && report.commentContentSnapshot);
    const matchesSearch =
      report.reporterNickname.includes(searchText) ||
      report.reportedUserNickname.includes(searchText);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['all', 'post', 'comment', 'user'].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded ${
                filter === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-white/80'
              }`}
            >
              {key === 'all'
                ? '전체'
                : key === 'post'
                ? '글'
                : key === 'comment'
                ? '댓글'
                : '유저'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="신고자 or 대상자 검색"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="bg-zinc-800 text-white px-3 py-1 rounded"
        />
      </div>

      {filter === 'user' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suspendedUsers.map((user) => (
            <div key={user.id} className="bg-white/5 p-4 rounded-xl text-sm flex flex-col gap-2">
              <div className="text-lg font-bold text-white">
                정지 해제일:{' '}
                {user.suspendedUntil === 'permanent'
                  ? '영구정지'
                  : user.suspendedUntil?.toDate
                  ? new Date(user.suspendedUntil.toDate()).toLocaleDateString(
                      'ko-KR',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )
                  : '날짜 없음'}
              </div>
              <div>
                📛 <span className="font-semibold">닉네임:</span> {user.nickname}
              </div>
              <div>
                ⛔ <span className="font-semibold">정지 횟수:</span> {user.suspensionCount}회
              </div>
              <div>
                ✅ <span className="font-semibold">유죄 횟수:</span> {guiltyCounts[user.id] || 1}회
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleUnban(user.id)}
                  className="text-sm px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  정지 해제
                </button>
                <button
                  onClick={() => handlePermanentSuspend(user.id)}
                  className="text-sm px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  영구정지
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white/5 p-4 rounded-xl text-sm flex flex-col gap-2">
              <div className="text-lg font-bold text-white">
                {report.createdAt?.toDate
                  ? new Date(report.createdAt.toDate()).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '날짜 없음'}
              </div>
              <div>
                🧨 <span className="font-semibold">신고 사유:</span> {report.reason}
              </div>
              <div>
                👤 <span className="font-semibold">신고자:</span> {report.reporterNickname}
              </div>
              <div>
                📛 <span className="font-semibold">신고 대상:</span> {report.reportedUserNickname}
              </div>
              <div>
                ✅ <span className="font-semibold">유죄 횟수:</span>{' '}
                {guiltyCounts[report.reportedUserId || ''] || 1}회
              </div>

              {report.postContentSnapshot && (
                <div className="bg-zinc-800 p-3 rounded text-white mt-2">
                  <div className="font-semibold mb-1">📌 신고된 글 내용</div>
                  <div className="mt-1">{report.postContentSnapshot}</div>
                  {report.postImageSnapshot && (
                    <img
                      src={report.postImageSnapshot}
                      alt="신고 이미지"
                      className="w-full max-w-xs mt-2 object-cover rounded"
                    />
                  )}
                </div>
              )}

              {report.commentContentSnapshot && (
                <div className="bg-zinc-800 p-3 rounded text-white mt-2">
                  <div className="font-semibold mb-1">💬 신고된 댓글 내용</div>
                  <div className="text-white/90">
                    작성자: {report.commentNicknameSnapshot || '익명'}
                  </div>
                  <div className="mt-1">{report.commentContentSnapshot}</div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => handleDelete(report.id)}
                  className="text-sm px-4 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
