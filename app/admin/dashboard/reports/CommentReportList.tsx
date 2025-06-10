"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

interface Report {
  id: string;
  type: string;
  targetId: string;
  postId?: string;
  songId?: string;
  parentCommentId?: string;
  reason: string;
  reporterId: string;
  reporterNickname?: string;
  reportedUserId: string;
  reportedUserNickname?: string;
  createdAt: any;
  commentContentSnapshot?: string;
  commentNicknameSnapshot?: string;
}

interface Comment {
  id: string;
  content: string;
  nickname: string;
}

export default function CommentReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<{ [id: string]: Comment | null }>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      const q = query(
        collection(db, "reports"),
        where("type", "==", "comment"),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      const fetchedReports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[];

      setReports(fetchedReports);

      const commentMap: { [id: string]: Comment | null } = {};

      for (const report of fetchedReports) {
        if (!Object.prototype.hasOwnProperty.call(commentMap, report.targetId)) {
          try {
            let commentDoc = null;

            if (report.songId && report.targetId) {
              if (report.parentCommentId) {
                commentDoc = await getDoc(doc(
                  db,
                  "songs",
                  report.songId,
                  "comments",
                  report.parentCommentId,
                  "replies",
                  report.targetId
                ));
              } else {
                commentDoc = await getDoc(doc(
                  db,
                  "songs",
                  report.songId,
                  "comments",
                  report.targetId
                ));
              }
            } else if (report.postId && report.targetId) {
              commentDoc = await getDoc(doc(
                db,
                "posts",
                report.postId,
                "comments",
                report.targetId
              ));
            }

            if (commentDoc && commentDoc.exists()) {
              const data = commentDoc.data();
              commentMap[report.targetId] = {
                id: commentDoc.id,
                content: data.content,
                nickname: data.nickname || "익명",
              };
            } else {
              commentMap[report.targetId] = null;
            }
          } catch (err) {
            console.error("댓글 로드 실패:", err);
            commentMap[report.targetId] = null;
          }
        }
      }

      setComments(commentMap);
    };

    fetchReports();
  }, []);

  const removeReportFromUI = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleInnocent = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      removeReportFromUI(reportId);
    } catch (err) {
      console.error("무죄 처리 실패:", err);
    }
  };

  const handleGuiltyAndSuspend = async (report: Report, duration: number | "permanent") => {
    try {
      const suspendedUntil =
        duration === "permanent" ? "permanent" : new Date(Date.now() + duration);

      await setDoc(doc(db, "users", report.reportedUserId), {
        suspendedUntil,
      }, { merge: true });

      await setDoc(doc(db, "guiltyReports", report.id), report);

      let ref;
      if (report.songId && report.targetId) {
        if (report.parentCommentId) {
          ref = doc(db, "songs", report.songId, "comments", report.parentCommentId, "replies", report.targetId);
        } else {
          ref = doc(db, "songs", report.songId, "comments", report.targetId);
        }
      } else if (report.postId && report.targetId) {
        ref = doc(db, "posts", report.postId, "comments", report.targetId);
      }

      if (ref) {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await deleteDoc(ref);
          console.log("✅ 댓글 삭제 완료");
        } else {
          console.warn("❌ 댓글 문서가 존재하지 않음");
        }
      } else {
        console.warn("❗삭제할 댓글 정보 부족");
      }

      await deleteDoc(doc(db, "reports", report.id));
      removeReportFromUI(report.id);

    } catch (err) {
      console.error("유죄 처리 중 오류:", err);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reports.map((report) => {
        const comment = comments[report.targetId];

        return (
          <div
            key={report.id}
            className="bg-white/5 p-4 rounded-xl text-sm flex flex-col gap-2"
          >
            <div>📝 <span className="font-semibold">신고 사유:</span> {report.reason}</div>
            <div>👤 <span className="font-semibold">신고자:</span> {report.reporterNickname || report.reporterId}</div>
            <div>📛 <span className="font-semibold">신고 대상:</span> {report.reportedUserNickname || report.reportedUserId}</div>
            <div className="text-gray-400">
              🕒 {report.createdAt?.toDate ? new Date(report.createdAt.toDate()).toLocaleString() : '날짜 없음'}
            </div>

            {comment ? (
              <div className="bg-zinc-800 p-3 rounded text-white mt-2">
                <div className="font-semibold mb-1">💬 신고된 댓글 내용</div>
                <div className="text-white/90">작성자: {comment.nickname}</div>
                <div className="mt-1">{comment.content}</div>
              </div>
            ) : report.commentContentSnapshot ? (
              <div className="bg-zinc-800 p-3 rounded text-white mt-2">
                <div className="font-semibold mb-1">💬 (삭제된 댓글 - 스냅샷)</div>
                <div className="text-white/90">작성자: {report.commentNicknameSnapshot || '익명'}</div>
                <div className="mt-1">{report.commentContentSnapshot}</div>
              </div>
            ) : (
              <div className="text-red-400">⚠️ 댓글을 불러올 수 없습니다</div>
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
                        onClick={() => handleGuiltyAndSuspend(report, opt.value)}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleInnocent(report.id)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
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
