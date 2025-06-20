"use client";

import { useEffect, useState } from "react";
import {
  approveSong,
  deleteSong,
  fetchSongsByStatus,
  pauseSong,
  rejectSong,
  restoreSong,
} from "./musicActions";
import { sendNotification } from "@/lib/notifications";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface Song {
  id: string;
  title: string;
  nickname: string;
  userId: string;
  audioURL: string;
  imageURLs?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  genre?: string;
  isPending: boolean;
  isVisible: boolean;
  isDeleted: boolean;
  likeCount?: number;
}

const statusMap = {
  "업로드 신청곡": "pending",
  "업로드 된 곡": "approved",
  "정지된 곡": "paused",
  "삭제된 곡": "deleted",
} as const;

type TabKey = keyof typeof statusMap;

const genreList = [
  "전체", "발라드", "힙합", "댄스", "인디", "락", "트로트", "국악",
];

// 프록시 URL 생성 함수
const getProxyURL = (audioURL: string): string => {
  try {
    const url = new URL(audioURL);
    const objectPathEncoded = url.pathname.split("/o/")[1];
    if (!objectPathEncoded) return audioURL;

    const objectPath = decodeURIComponent(objectPathEncoded);

    return `https://cdnhandler-u5ungghf3a-du.a.run.app/${objectPath}`;
  } catch {
    return audioURL;
  }
};

export default function MusicListPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>("업로드 신청곡");
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("전체");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const [editingLikeId, setEditingLikeId] = useState<string | null>(null);
  const [likeEditValue, setLikeEditValue] = useState<number | null>(null);

  const isAdmin = true;

  useEffect(() => {
    (async () => {
      const result = await fetchSongsByStatus(statusMap[selectedTab]);
      setSongs(result);
      setSelectedSong(null);
    })();
  }, [selectedTab]);

  const filteredSongs = songs.filter((song) => {
    const genreOK = selectedGenre === "전체" || song.genre === selectedGenre;
    const keyword = searchTerm.toLowerCase();
    const textOK =
      song.title.toLowerCase().includes(keyword) ||
      song.nickname.toLowerCase().includes(keyword);
    return genreOK && textOK;
  });

  const refreshAfterAction = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    setSelectedSong(null);
  };

  const updateLikeCount = async (songId: string, likeCount: number) => {
    await updateDoc(doc(db, "songs", songId), { likeCount });
  };

  const songCounts = {
    "업로드 신청곡": songs.filter((s) => s.isPending && !s.isDeleted).length,
    "업로드 된 곡": songs.filter((s) => s.isVisible && !s.isDeleted).length,
    "정지된 곡": songs.filter((s) => !s.isVisible && !s.isPending && !s.isDeleted).length,
    "삭제된 곡": songs.filter((s) => s.isDeleted).length,
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">🎵 관리자 - 음악 관리</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        {Object.keys(statusMap).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as TabKey)}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${
              selectedTab === tab ? "bg-purple-600" : "bg-zinc-700 hover:bg-zinc-600"
            }`}
          >
            {tab} <span className="text-purple-300">({songCounts[tab as TabKey]})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="제목 또는 닉네임 검색"
          className="bg-zinc-800 text-white px-4 py-2 rounded-md w-60"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="bg-zinc-800 text-white px-4 py-2 rounded-md"
        >
          {genreList.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* 선택된 곡 정보 */}
      {selectedSong && (
        <div className="mb-6 p-4 bg-white/10 rounded-xl">
          <div className="text-xl font-bold mb-1">{selectedSong.title}</div>
          <div className="text-sm text-gray-400 mb-2">
            {selectedSong.nickname} · {selectedSong.genre}
          </div>
          <audio
            key={selectedSong.id}
            controls
            preload="auto"
            src={getProxyURL(selectedSong.audioURL)}
            className="w-full mb-4"
          />

          <div className="flex flex-wrap gap-2">
            {selectedTab === "업로드 신청곡" && (
              <>
                <button className="bg-green-600 px-4 py-1 rounded hover:bg-green-700"
                  onClick={async () => {
                    if (!selectedSong) return;
                    await approveSong(selectedSong.id, selectedSong.title, selectedSong.userId);
                    refreshAfterAction(selectedSong.id);
                  }}>
                  업로드
                </button>
                <button className="bg-red-600 px-4 py-1 rounded hover:bg-red-700"
                  onClick={async () => {
                    if (!selectedSong) return;
                    await rejectSong(selectedSong.id, selectedSong.title, selectedSong.userId);
                    refreshAfterAction(selectedSong.id);
                  }}>
                  반려
                </button>
              </>
            )}
            {selectedTab === "업로드 된 곡" && (
              <>
                <button className="bg-yellow-600 px-4 py-1 rounded hover:bg-yellow-700"
                  onClick={async () => {
                    if (!selectedSong) return;
                    await pauseSong(selectedSong.id, selectedSong.title, selectedSong.userId);
                    refreshAfterAction(selectedSong.id);
                  }}>
                  정지
                </button>
                <button className="bg-red-700 px-4 py-1 rounded hover:bg-red-800"
                  onClick={async () => {
                    if (!selectedSong) return;
                    await deleteSong(selectedSong.id, selectedSong.title, selectedSong.userId);
                    refreshAfterAction(selectedSong.id);
                  }}>
                  삭제
                </button>
              </>
            )}
            {selectedTab === "정지된 곡" && (
              <>
                <button className="bg-green-600 px-4 py-1 rounded hover:bg-green-700"
                  onClick={async () => {
                    if (!selectedSong) return;
                    await approveSong(selectedSong.id, selectedSong.title, selectedSong.userId);
                    refreshAfterAction(selectedSong.id);
                  }}>
                  되살리기
                </button>
                <button className="bg-red-700 px-4 py-1 rounded hover:bg-red-800"
                  onClick={async () => {
                    if (!selectedSong) return;
                    await deleteSong(selectedSong.id, selectedSong.title, selectedSong.userId);
                    refreshAfterAction(selectedSong.id);
                  }}>
                  삭제
                </button>
              </>
            )}
            {selectedTab === "삭제된 곡" && (
              <>
                <button className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-700"
                  onClick={async () => {
                    if (!selectedSong) return;
                    await restoreSong(selectedSong.id, selectedSong.title, selectedSong.userId);
                    refreshAfterAction(selectedSong.id);
                  }}>
                  복원
                </button>
                <button className="bg-red-800 px-4 py-1 rounded hover:bg-red-900"
                  onClick={async () => {
                    if (!selectedSong) return;
                    const confirmed = confirm("정말로 완전히 삭제하시겠습니까?");
                    if (!confirmed) return;
                    await deleteSong(selectedSong.id, selectedSong.title, selectedSong.userId, true);
                    await sendNotification(selectedSong.userId, `🚫 '${selectedSong.title}' 업로드가 완전히 삭제되었습니다.`);
                    refreshAfterAction(selectedSong.id);
                  }}>
                  완전 삭제
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 곡 리스트 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            onClick={() => setSelectedSong(song)}
            className={`cursor-pointer bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition border-2 ${
              selectedSong?.id === song.id ? "border-purple-500" : "border-transparent"
            }`}
          >
            <img
              src={song.imageURLs?.small || "/default-thumbnail.png"}
              alt="썸네일"
              className="w-full h-32 object-cover"
            />

            <div className="p-3">
              <div className="text-sm font-semibold truncate flex items-center">
                {song.title}
                {typeof song.likeCount === "number" && (
                  <>
                    <span className="ml-1 text-xs text-purple-400">❤️ {song.likeCount}</span>
                    {isAdmin && (
                      <>
                        <button
                          className="ml-1 text-xs text-yellow-400 hover:text-yellow-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLikeId(song.id);
                            setLikeEditValue(song.likeCount ?? 0);
                          }}
                        >
                          ✴
                        </button>
                        {editingLikeId === song.id && (
                          <input
                            type="number"
                            value={likeEditValue ?? ""}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setLikeEditValue(Number(e.target.value))}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && likeEditValue != null) {
                                await updateLikeCount(song.id, likeEditValue);
                                setSongs((prev) =>
                                  prev.map((s) =>
                                    s.id === song.id ? { ...s, likeCount: likeEditValue } : s
                                  )
                                );
                                setEditingLikeId(null);
                              }
                            }}
                            className="ml-2 w-14 px-1 py-0.5 text-xs text-black rounded"
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {song.nickname} · {song.genre}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
