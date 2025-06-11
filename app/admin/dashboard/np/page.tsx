'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

interface UserModel {
  id: string;
  nickname: string;
  np: number;
}

interface TransactionLog {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  context: string;
  timestamp: any;
}

export default function AdminNPManagementPage() {
  const [searchText, setSearchText] = useState('');
  const [user, setUser] = useState<UserModel | null>(null);
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [amount, setAmount] = useState<number>(0);

  const handleSearch = async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('nickname', '==', searchText));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      setUser({
        id: userDoc.id,
        nickname: userData.nickname,
        np: userData.np || 0,
      });
      fetchLogs(userDoc.id);
    } else {
      setUser(null);
      setLogs([]);
      alert('사용자를 찾을 수 없습니다.');
    }
  };

  const fetchLogs = async (uid: string) => {
    const fromQuery = query(
      collection(db, 'transactions'),
      where('fromUserId', '==', uid),
      orderBy('timestamp', 'desc')
    );

    const toQuery = query(
      collection(db, 'transactions'),
      where('toUserId', '==', uid),
      orderBy('timestamp', 'desc')
    );

    const [fromSnapshot, toSnapshot] = await Promise.all([
      getDocs(fromQuery),
      getDocs(toQuery),
    ]);

    const fromLogs = fromSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TransactionLog));
    const toLogs = toSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TransactionLog));

    const merged = [...fromLogs, ...toLogs]
      .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
      .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

    setLogs(merged);
  };

  const updateNP = async (type: 'charge' | 'deduct') => {
    if (!user) return;

    const newBalance =
      type === 'charge'
        ? user.np + amount
        : Math.max(0, user.np - amount);

    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, { np: newBalance });

    await addDoc(collection(db, 'transactions'), {
      fromUserId: 'ADMIN',
      toUserId: user.id,
      amount: type === 'charge' ? amount : -amount,
      context: type === 'charge' ? '관리자 충전' : '관리자 회수',
      timestamp: new Date(),
    });

    setUser({ ...user, np: newBalance });
    fetchLogs(user.id);
    setAmount(0);
  };

  const formatDate = (value: any) => {
    if (value?.toDate) return new Date(value.toDate()).toLocaleString();
    if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
    return new Date(value).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">📀 NP 관리소</h1>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="닉네임으로 검색"
            className="px-4 py-2 rounded-md bg-zinc-800 text-white flex-1"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md"
            onClick={handleSearch}
          >
            검색
          </button>
        </div>

        {user && (
          <div className="bg-zinc-900 p-4 rounded-md space-y-2">
            <div className="text-lg font-semibold">🎧 {user.nickname}</div>
            <div>보유 NP코인: {user.np}</div>

            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                className="px-3 py-1 bg-zinc-800 rounded-md w-28"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              />
              <button
                onClick={() => updateNP('charge')}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md"
              >
                + 충전
              </button>
              <button
                onClick={() => updateNP('deduct')}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
              >
                - 회수
              </button>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-zinc-900 p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">📋 거래 로그</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 text-left">
                  <th className="pb-2">시간</th>
                  <th className="pb-2">보낸 사람</th>
                  <th className="pb-2">받는 사람</th>
                  <th className="pb-2">수량</th>
                  <th className="pb-2">사유</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-zinc-800">
                    <td className="py-1">{formatDate(log.timestamp)}</td>
                    <td>{log.fromUserId}</td>
                    <td>{log.toUserId}</td>
                    <td>{log.amount}</td>
                    <td>{log.context}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
