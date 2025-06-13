"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  setDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface ContactMessage {
  id: string;
  nickname: string;
  email: string;
  message: string;
  createdAt: Date;
}

export default function AdminContactListView() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [answeredMessages, setAnsweredMessages] = useState<ContactMessage[]>([]);
  const [view, setView] = useState<"inbox" | "answered">("inbox");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.getIdToken(true);
        fetchMessages();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchMessages = async () => {
    const normalize = (snap: any) =>
      snap.docs.map((d: any) => {
        const data = d.data();
        const raw = data.createdAt;
        const createdAt =
          raw instanceof Timestamp
            ? raw.toDate()
            : typeof raw?.toDate === "function"
            ? raw.toDate()
            : new Date(raw);
        return {
          id: d.id,
          ...data,
          createdAt,
        };
      });

    const inboxSnap = await getDocs(query(collection(db, "contactMessages"), orderBy("createdAt", "desc")));
    setMessages(normalize(inboxSnap));

    const answeredSnap = await getDocs(query(collection(db, "answeredMessages"), orderBy("createdAt", "desc")));
    setAnsweredMessages(normalize(answeredSnap));
  };

  const handleDelete = async (id: string, isAnswered: boolean) => {
    const target = isAnswered ? "answeredMessages" : "contactMessages";
    await deleteDoc(doc(db, target, id));
    if (isAnswered) {
      setAnsweredMessages((prev) => prev.filter((msg) => msg.id !== id));
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }
  };

  const handleMarkAsAnswered = async (msg: ContactMessage) => {
    await setDoc(doc(db, "answeredMessages", msg.id), msg);
    await deleteDoc(doc(db, "contactMessages", msg.id));
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setAnsweredMessages((prev) => [msg, ...prev]);
  };

  const currentMessages = view === "inbox" ? messages : answeredMessages;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">📮 관리자 문의 관리</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setView("inbox")}
          className={`px-4 py-2 rounded-md font-semibold ${
            view === "inbox" ? "bg-purple-600" : "bg-zinc-700 hover:bg-zinc-600"
          }`}
        >
          문의 내용
        </button>
        <button
          onClick={() => setView("answered")}
          className={`px-4 py-2 rounded-md font-semibold ${
            view === "answered" ? "bg-purple-600" : "bg-zinc-700 hover:bg-zinc-600"
          }`}
        >
          문의 내용 완료
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentMessages.map((msg) => (
          <div key={msg.id} className="bg-zinc-800 p-4 rounded-lg shadow-md flex flex-col justify-between h-64">
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">닉네임:</span> {msg.nickname}</p>
              <p><span className="font-semibold">이메일:</span> {msg.email}</p>
              <p><span className="font-semibold">문의:</span> {msg.message}</p>
              <p><span className="font-semibold">작성일:</span> {msg.createdAt.toLocaleString()}</p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              {view === "inbox" && (
                <button
                  onClick={() => handleMarkAsAnswered(msg)}
                  className="text-xs text-green-400 hover:underline"
                >
                  완료
                </button>
              )}
              <button
                onClick={() => handleDelete(msg.id, view === "answered")}
                className="text-xs text-red-400 hover:underline"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}