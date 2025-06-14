"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  setDoc,
  doc,
  addDoc,
  query,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface ContactMessage {
  id: string;
  nickname: string;
  email: string;
  message: string;
  createdAt: Date;
   userId: string; 
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
  try {
    // answeredMessages에 이동
    await setDoc(doc(db, "answeredMessages", msg.id), {
      ...msg,
      createdAt: Timestamp.fromDate(new Date(msg.createdAt)),
    });
    await deleteDoc(doc(db, "contactMessages", msg.id));

    // 🔥 Notification 하위 컬렉션에 저장
    await addDoc(
      collection(db, "users", msg.userId, "notifications"),
      {
        title: "문의 완료",
        message: `문의 내용이 이메일(${msg.email})로 회신되었습니다.`,
        createdAt: Timestamp.now(),
        isRead: false
      }
    );

    // UI 업데이트
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setAnsweredMessages((prev) => [msg, ...prev]);
  } catch (error) {
    console.error("완료 처리 실패:", error);
  }
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
            <div className="flex justify-end gap-4 mt-4">
              {view === "inbox" && (
                <button
                  onClick={() => handleMarkAsAnswered(msg)}
                  className="px-3 py-2 bg-green-600 rounded text-white text-sm hover:bg-green-500"
                >
                  완료
                </button>
              )}
              <button
                onClick={() => handleDelete(msg.id, view === "answered")}
                className="px-3 py-2 bg-red-600 rounded text-white text-sm hover:bg-red-500"
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
