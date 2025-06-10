import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Report {
  id: string;
  type: string;
  targetId: string;
  reason: string;
  reporterId: string;
  reporterNickname: string;
  reportedUserNickname: string;
  reportedUserId: string;
  fanPostOwnerId?: string;
  createdAt: any;
  postContentSnapshot?: string;
  postImageSnapshot?: string;
}

interface Post {
  id: string;
  content: string;
  nickname: string;
  imageURL?: string;
}

interface PostState {
  exists: boolean;
  data?: Post;
}

export default function PostReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<{ [id: string]: PostState }>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      const q = query(collection(db, "reports"), where("type", "==", "post"));
      const snapshot = await getDocs(q);
      const fetchedReports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[];
      setReports(fetchedReports);

      const postMap: { [id: string]: PostState } = {};
      for (const report of fetchedReports) {
        const postId = report.targetId;
        let foundPost: PostState | null = null;

        // 1차: 일반 post
        const postRef = doc(db, "posts", postId);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
          const data = postDoc.data();
          foundPost = {
            exists: true,
            data: {
              id: postDoc.id,
              content: data.content,
              nickname: data.nickname || "익명",
              imageURL: data.imageURL || "",
            },
          };
        }

        // 2차: fanPost
        if (!foundPost) {
          const fanOwnerId = report.fanPostOwnerId || report.reportedUserId;
          const fanPostRef = doc(db, "users", fanOwnerId, "fanPosts", postId);
          const fanPostDoc = await getDoc(fanPostRef);
          if (fanPostDoc.exists()) {
            const data = fanPostDoc.data();
            foundPost = {
              exists: true,
              data: {
                id: fanPostDoc.id,
                content: data.content,
                nickname: data.nickname || "익명",
                imageURL: data.imageURL || "",
              },
            };
          }
        }

        postMap[postId] = foundPost || { exists: false };
      }

      setPosts(postMap);
    };

    fetchReports();
  }, []);

const handleSuspendAndGuilty = async (report: Report, duration: number | "permanent") => {
  try {
    const suspendedUntil =
      duration === "permanent" ? "permanent" : new Date(Date.now() + duration);

    await setDoc(doc(db, "users", report.reportedUserId), {
      suspendedUntil,
    }, { merge: true });

    // 🔥 [1] 게시글 삭제 처리
    const postId = report.targetId;

    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      await deleteDoc(postRef);
    } else {
      // 🔥 팬 게시글이라면 users/{fanPostOwnerId}/fanPosts/{postId}
      const fanOwnerId = report.fanPostOwnerId || report.reportedUserId;
      const fanPostRef = doc(db, "users", fanOwnerId, "fanPosts", postId);
      const fanPostDoc = await getDoc(fanPostRef);

      if (fanPostDoc.exists()) {
        await deleteDoc(fanPostRef);
      }
    }

    // 🔥 [2] 신고 기록 이동
    await setDoc(doc(db, "guiltyReports", report.id), report);
    await deleteDoc(doc(db, "reports", report.id));

    setReports((prev) => prev.filter((r) => r.id !== report.id));
    setOpenMenuId(null);
    alert("✅ 정지, 유죄 처리 및 게시물 삭제 완료");
  } catch (err) {
    console.error("❌ 처리 실패:", err);
    alert("처리 중 오류가 발생했습니다.");
  }
};


  const handleInnocent = async (report: Report) => {
    try {
      await deleteDoc(doc(db, "reports", report.id));
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      console.error("❌ 무죄 처리 실패:", err);
    }
  };

  const suspendOptions: { label: string; value: number | "permanent" }[] = [
    { label: "1분", value: 1 * 60 * 1000 },
    { label: "1일", value: 24 * 60 * 60 * 1000 },
    { label: "2일", value: 2 * 24 * 60 * 60 * 1000 },
    { label: "3일", value: 3 * 24 * 60 * 60 * 1000 },
    { label: "영구정지", value: "permanent" },
  ];

  return (
    <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {reports.map((report) => {
        const postState = posts[report.targetId];

        return (
          <div key={report.id} className="bg-white/5 p-4 rounded-xl text-sm flex flex-col gap-2">
            <div>📝 <span className="font-semibold">신고 사유:</span> {report.reason}</div>
            <div>👤 <span className="font-semibold">신고자:</span> {report.reporterNickname ?? report.reporterId}</div>
            <div>📛 <span className="font-semibold">신고 대상:</span> {report.reportedUserNickname ?? report.reportedUserId}</div>
            <div className="text-gray-400">
              🕒 {report.createdAt?.toDate ? new Date(report.createdAt.toDate()).toLocaleString() : "날짜 없음"}
            </div>

            {postState?.exists ? (
              <div className="bg-zinc-800 p-3 rounded text-white mt-2">
                <div className="font-semibold mb-1">📌 신고된 글 내용</div>
                <div className="text-white/90">작성자: {postState.data?.nickname}</div>
                {postState.data?.imageURL && (
                  <img src={postState.data.imageURL} alt="신고된 이미지" className="w-full max-w-xs mt-2 mb-2 rounded object-cover" />
                )}
                <div className="mt-1 mb-2">{postState.data?.content}</div>
              </div>
            ) : (
              (report.postContentSnapshot || report.postImageSnapshot) && (
                <div className="bg-zinc-800 p-3 rounded text-white mt-2">
                  <div className="font-semibold mb-1">📌 (삭제됨) 당시 글 Snapshot</div>
                  <div className="text-white/90">작성자: {report.reportedUserNickname ?? "알 수 없음"}</div>
                  {report.postImageSnapshot && (
                    <img
                      src={report.postImageSnapshot}
                      alt="snapshot"
                      className="w-full max-w-xs rounded mt-2 mb-2 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  {report.postContentSnapshot && (
                    <div className="mt-1 mb-2">{report.postContentSnapshot}</div>
                  )}
                </div>
              )
            )}

            <div className="flex gap-2 mt-2 items-center">
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  ✅ 유죄 + 정지
                </button>
                {openMenuId === report.id && (
                  <div className="absolute mt-1 left-0 bg-zinc-900 border border-zinc-600 rounded shadow-lg z-10">
                    {suspendOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => handleSuspendAndGuilty(report, opt.value)}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleInnocent(report)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded"
              >
                ❌ 무죄
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}