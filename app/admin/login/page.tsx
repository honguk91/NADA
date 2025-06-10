// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { auth } from "@/lib/firebase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const db = getFirestore();

  const handleLogin = async () => {
    setError("");
    console.log("🧪 로그인 시도:", email, password);

    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().isAdmin === true) {
        router.push("/admin/dashboard");
      } else {
        setError("관리자 권한이 없습니다.");
      }
  } catch (err: any) {
  console.error("❌ 로그인 실패", err.code, err.message);
  switch (err.code) {
    case "auth/invalid-email":
      setError("유효하지 않은 이메일 형식입니다.");
      break;
    case "auth/user-disabled":
      setError("이 계정은 비활성화되었습니다.");
      break;
    case "auth/user-not-found":
    case "auth/wrong-password":
      setError("잘못된 이메일 또는 비밀번호입니다.");
      break;
    default:
      setError("로그인 중 알 수 없는 오류가 발생했습니다.");
  }
}

  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="bg-zinc-900 p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-white text-xl font-bold mb-6 text-center">관리자 로그인</h1>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700 focus:outline-none"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700 focus:outline-none"
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
        >
          로그인
        </button>
      </div>
    </div>
  );
}