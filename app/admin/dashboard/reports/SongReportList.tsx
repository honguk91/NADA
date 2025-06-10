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
  reason: string;
  reporterId: string;
  reporterNickname?: string;
  reportedUserId: string;
  reportedUserNickname?: string;
  createdAt: any;
  songId?: string;
}

interface Song {
  id: string;
  title: string;
  nickname: string;
}

export default function SongReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [songs, setSongs] = useState<{ [id: string]: Song }>({});

  useEffect(() => {
    const fetchReports = async () => {
      const q = query(
        collection(db, "reports"),
        where("type", "==", "song"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const fetchedReports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[];

      setReports(fetchedReports);

      const uniqueSongIds = [
        ...new Set(
          fetchedReports
            .map((r) => r.songId)
            .filter((id): id is string => typeof id === "string" && id.trim() !== "")
        ),
      ];

      const songMap: { [id: string]: Song } = {};

      await Promise.all(
        uniqueSongIds.map(async (songId) => {
          try {
            const songDoc = await getDoc(doc(db, "songs", songId));
            if (songDoc.exists()) {
              const data = songDoc.data();
              songMap[songId] = {
                id: songDoc.id,
                title: data.title,
                nickname: data.nickname,
              };
            }
          } catch (err) {
            console.error("곡 제목 로딩 실패:", err);
          }
        })
      );

      setSongs(songMap);
    };

    fetchReports();
  }, []);

  const handleInnocent = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error("무죄 처리 실패:", error);
    }
  };

  const handleGuilty = (report: Report) => {
    console.log(`유죄 처리됨: 신고 대상 - ${report.reportedUserNickname ?? report.reportedUserId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-white/5 p-4 rounded-xl text-sm flex flex-col gap-2"
        >
          <div>📝 <span className="font-semibold">신고 사유:</span> {report.reason}</div>
          <div>👤 <span className="font-semibold">신고자:</span> {report.reporterNickname ?? report.reporterId}</div>
          <div>📛 <span className="font-semibold">신고 대상:</span> {report.reportedUserNickname ?? report.reportedUserId}</div>
          <div>🕒 <span className="text-gray-400">{report.createdAt?.toDate ? new Date(report.createdAt.toDate()).toLocaleString() : "날짜 없음"}</span></div>

          {report.songId && songs[report.songId] ? (
            <div className="bg-zinc-800 p-3 rounded text-white mt-2">
              <div className="text-lg font-semibold">
                🎵 제목: {songs[report.songId].title}
              </div>
              <div className="text-sm text-gray-400">
                👤 아티스트: {songs[report.songId].nickname}
              </div>
            </div>
          ) : (
            <div className="text-red-400">⚠️ 삭제된 곡이거나 정보를 불러올 수 없습니다</div>
          )}

          <div className="flex gap-3 mt-3">
            <button
              onClick={() => handleGuilty(report)}
              className="text-sm text-red-400 hover:text-white border border-red-500 px-3 py-1 rounded"
            >
              유죄
            </button>
            <button
              onClick={() => handleInnocent(report.id)}
              className="text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded"
            >
              무죄
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
