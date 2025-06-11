'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import Image from 'next/image';

interface ContactMessage {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  createdAt: any;
  profileImageURL?: string;
}

export default function AdminContactListView() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: ContactMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ContactMessage[];
      setMessages(list);
    };

    fetchMessages();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'contactMessages', id));
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">✉️ 문의 메시지</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {messages.map((msg) => {
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
                  <p className="text-xs text-zinc-400">{dateStr} {timeStr}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-100 flex-grow overflow-auto">{msg.message}</p>
              <button
                onClick={() => handleDelete(msg.id)}
                className="self-end text-xs text-red-400 mt-2 hover:underline"
              >
                삭제
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
