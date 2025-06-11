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

interface Song {
  id: string;
  title: string;
  nickname: string;
  audioURL: string;
  imageURL: string;
  genre?: string;
  isPending: boolean;
  isVisible: boolean;
  isDeleted: boolean;
}

const statusMap = {
  "업로드 신청곡": "pending",
  "업로드 된 곡": "approved",
  "정지된 곡": "paused",
  "삭제된 곡": "deleted",
} as const;

const genreList = ["전체", "발라드", "힙합", "댄스", "인디", "락", "트로트", "국악"];
const tabs = Object.keys(statusMap);
type TabKey = keyof typeof statusMap;

export default function MusicListPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>("업로드 신청곡");
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("전체");
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const result = await fetchSongsByStatus(statusMap[selectedTab]);
      setSongs(result);
      setSelectedAudio(null); // 탭 변경 시 재생 중지
    };
    fetch();
  }, [selectedTab]);

  const filteredSongs = songs.filter(
    (song) =>
      (selectedGenre === "전체" || song.genre === selectedGenre) &&
      (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 bg-black min-h-screen text-white flex flex-col">
      {/* 상단 고정 오디오 영역 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">🎵 관리자 - 음악 관리</h1>

        <div className="flex gap-4 mb-4 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as TabKey)}
              className={`px-4 py-2 rounded-md text-sm font-semibold ${
                selectedTab === tab
                  ? "bg-purple-600"
                  : "bg-zinc-700 hover:bg-zinc-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-2 items-center">
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
            {genreList.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {selectedAudio && (
          <audio
            controls
            src={selectedAudio}
            className="w-full mt-3 rounded bg-zinc-800"
            autoPlay
          />
        )}
      </div>

      {/* 리스트 영역: 하단 3분의 2 높이 */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="bg-white/5 p-4 rounded-xl flex items-center gap-4"
          >
            <img
              src={song.imageURL || "/default-thumbnail.png"}
              className="w-20 h-20 object-cover rounded"
              alt="썸네일"
            />
            <div className="flex-1">
              <div className="text-lg font-semibold">{song.title}</div>
              <div className="text-sm text-gray-400">
                {song.nickname} · {song.genre}
              </div>
              <button
                onClick={() => setSelectedAudio(song.audioURL)}
                className="mt-2 text-sm text-purple-400 underline hover:text-purple-300"
              >
                ▶︎ 이 노래 재생
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {selectedTab === "업로드 신청곡" && (
                <>
                  <button
                    onClick={async () => {
                      await approveSong(song.id);
                      setSongs((prev) => prev.filter((s) => s.id !== song.id));
                    }}
                    className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                  >
                    업로드
                  </button>
                  <button
                    onClick={async () => {
                      await rejectSong(song.id);
                      setSongs((prev) => prev.filter((s) => s.id !== song.id));
                    }}
                    className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                  >
                    반려
                  </button>
                </>
              )}

              {selectedTab === "업로드 된 곡" && (
                <>
                  <button
                    onClick={async () => {
                      await pauseSong(song.id);
                      setSongs((prev) => prev.filter((s) => s.id !== song.id));
                    }}
                    className="bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-700"
                  >
                    정지
                  </button>
                  <button
                    onClick={async () => {
                      await deleteSong(song.id);
                      setSongs((prev) => prev.filter((s) => s.id !== song.id));
                    }}
                    className="bg-red-700 px-3 py-1 rounded hover:bg-red-800"
                  >
                    삭제
                  </button>
                </>
              )}

              {selectedTab === "정지된 곡" && (
                <button
                  onClick={async () => {
                    await approveSong(song.id);
                    setSongs((prev) => prev.filter((s) => s.id !== song.id));
                  }}
                  className="bg-purple-600 px-3 py-1 rounded hover:bg-purple-700"
                >
                  되살리기
                </button>
              )}

              {selectedTab === "삭제된 곡" && (
                <button
                  onClick={async () => {
                    await restoreSong(song.id);
                    setSongs((prev) => prev.filter((s) => s.id !== song.id));
                  }}
                  className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                >
                  복원
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
