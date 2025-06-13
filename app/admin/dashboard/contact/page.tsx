"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface ContactMessage {
  id: string;
  nickname: string;
  email: string;
  message: string;
}

export default function ContactList() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const snap = await getDocs(collection(db, "contactMessages"));
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            nickname: data.nickname || "익명",
            email: data.email || "",
            message: data.message || "(빈 내용)",
          };
        });
        setMessages(list);
        console.log("✅ 불러온 문의글:", list);
      } catch (err) {
        console.error("❌ Firestore 읽기 실패:", err);
      }
    };

    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">📨 문의글 목록</h1>
      {messages.length === 0 ? (
        <p className="text-gray-400">문의글이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((msg) => (
            <li key={msg.id} className="bg-zinc-800 p-4 rounded-lg shadow-md">
              <p className="font-semibold">{msg.nickname}</p>
              <p className="text-sm text-gray-400">{msg.email}</p>
              <p className="mt-2">{msg.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
