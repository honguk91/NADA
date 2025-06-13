// app/admin/contact/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import Image from 'next/image';

interface ContactMessage {
  id: string;
  userId: string;
  nickname: string;
  email: string;
  message: string;
  createdAt: any;
  profileImageURL?: string;
}

export default function AdminContactListView() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [answeredMessages, setAnsweredMessages] = useState<ContactMessage[]>([]);
  const [view, setView] = useState<'inbox' | 'answered'>('inbox');

  useEffect(() => {
    const fetchMessages = async () => {
      const inboxQ = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
      const inboxSnap = await getDocs(inboxQ);
      const inboxList = inboxSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContactMessage[];

      const answeredQ = query(collection(db, 'answeredMessages'), orderBy('createdAt', 'desc'));
      const answeredSnap = await getDocs(answeredQ);
      const answeredList = answeredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContactMessage[];

      setMessages(inboxList);
      setAnsweredMessages(answeredList);
    };

    fetchMessages();
  }, []);

  const handleDelete = async (id: string, isAnswered: boolean) => {
    const target = isAnswered ? 'answeredMessages' : 'contactMessages';
    await deleteDoc(doc(db, target, id));
    if (isAnswered) {
      setAnsweredMessages(prev => prev.filter(msg => msg.id !== id));
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }
  };

  const handleMarkAsAnswered = async (msg: ContactMessage) => {
    await setDoc(doc(db, 'answeredMessages', msg.id), msg);
    await deleteDoc(doc(db, 'contactMessages', msg.id));
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    setAnsweredMessages(prev => [msg, ...prev]);
  };

  const currentMessages = view === 'inbox' ? messages : answeredMessages;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">📮 관리자 문의 관리</h1>

      {/* 🔹 탭 버튼 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setView('inbox')}
          className={`px-4 py-2 rounded-md font-semibold ${view === 'inbox' ? 'bg-purple-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
        >
          문의 내용
        </button>
        <button
          onClick={() => setView('answered')}
          className={`px-4 py-2 rounded-md font-semibold ${view === 'answered' ? 'bg-purple-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
        >
          문의 내용 대답
        </button>
      </div>

      {/* 🔹 메시지 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentMessages.map((msg) => {
          const date = msg.createdAt?.toDate?.();
          const dateStr = date ? date.toLocaleDateString() : '-';
          const timeStr = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

          return (
            <div
              key={msg.id}
              className="bg-zinc-800 p-4 rounded-lg shadow-md flex flex-col justify-between h-60"
            >
              <div className="flex items-center space-x-4 mb-2">
                {msg.profileImageURL ? (
                  <Image
                    src={msg.profileImageURL}
                    width={40}
                    height={40}
                    alt="profile"
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-600" />
                )}
                <div>
                  <p className="font-semibold text-sm">{msg.nickname}</p>
                  <p className="text-xs text-zinc-400">{msg.email}</p>
                  <p className="text-xs text-zinc-400">{dateStr} {timeStr}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-100 flex-grow overflow-auto">{msg.message}</p>

              <div className="flex justify-end gap-2 mt-3">
                {view === 'inbox' && (
                  <button
                    onClick={() => handleMarkAsAnswered(msg)}
                    className="text-xs text-green-400 hover:underline"
                  >
                    대답함
                  </button>
                )}
                <button
                  onClick={() => handleDelete(msg.id, view === 'answered')}
                  className="text-xs text-red-400 hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
