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
  likeCount?: number;
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
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const result = await fetchSongsByStatus(statusMap[selectedTab]);
      setSongs(result);
      setSelectedSong(null);
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
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">🎵 관리자 - 음악 관리</h1>

      {/* 탭 버튼 */}
      <div className="flex gap-4 mb-6 flex-wrap">
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

      {/* 검색 및 장르 필터 */}
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
          {genreList.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      {/* 오디오 플레이어 */}
      {selectedSong && (
        <div className="mb-6 p-4 bg-white/10 rounded-xl">
          <div className="text-xl font-bold mb-1">{selectedSong.title}</div>
          <div className="text-sm text-gray-400 mb-2">
            {selectedSong.nickname} · {selectedSong.genre}
          </div>
          <audio controls src={selectedSong.audioURL} className="w-full mb-4" />

          <div className="flex flex-wrap gap-2">
            {selectedTab === "업로드 신청곡" && (
              <>
                <button
                  onClick={async () => {
                    await approveSong(selectedSong.id);
                    setSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
                    setSelectedSong(null);
                  }}
                  className="bg-green-600 px-4 py-1 rounded hover:bg-green-700"
                >
                  업로드
                </button>
                <button
                  onClick={async () => {
                    await rejectSong(selectedSong.id);
                    setSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
                    setSelectedSong(null);
                  }}
                  className="bg-red-600 px-4 py-1 rounded hover:bg-red-700"
                >
                  반려
                </button>
              </>
            )}

            {selectedTab === "업로드 된 곡" && (
              <>
                <button
                  onClick={async () => {
                    await pauseSong(selectedSong.id);
                    setSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
                    setSelectedSong(null);
                  }}
                  className="bg-yellow-600 px-4 py-1 rounded hover:bg-yellow-700"
                >
                  정지
                </button>
                <button
                  onClick={async () => {
                    await deleteSong(selectedSong.id);
                    setSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
                    setSelectedSong(null);
                  }}
                  className="bg-red-700 px-4 py-1 rounded hover:bg-red-800"
                >
                  삭제
                </button>
              </>
            )}

            {selectedTab === "정지된 곡" && (
  <>
    <button
      onClick={async () => {
        await approveSong(selectedSong.id);
        setSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
        setSelectedSong(null);
      }}
      className="bg-purple-600 px-4 py-1 rounded hover:bg-purple-700"
    >
      되살리기
    </button>

    <button
      onClick={async () => {
        await deleteSong(selectedSong.id); // soft delete
        setSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
        setSelectedSong(null);
      }}
      className="bg-red-700 px-4 py-1 rounded hover:bg-red-800"
    >
      삭제
    </button>
  </>
)}

            {selectedTab === "삭제된 곡" && (
              <>
                <button
                  onClick={async () => {
                    await restoreSong(selectedSong.id);
                    setSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
                    setSelectedSong(null);
                  }}
                  className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-700"
                >
                  복원
                </button>
                <button
                  onClick={async () => {
                    const confirmed = confirm("정말로 완전히 삭제하시겠습니까?");
                    if (!confirmed) return;

                    await deleteSong(selectedSong.id, true);
                    setSongs((prev) => prev.filter((s) => s.id !== selectedSong.id));
                    setSelectedSong(null);
                  }}
                  className="bg-red-800 px-4 py-1 rounded hover:bg-red-900"
                >
                  완전 삭제
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 카드 리스트 */}
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
              src={song.imageURL || "/default-thumbnail.png"}
              alt="썸네일"
              className="w-full h-32 object-cover"
            />
            <div className="p-3">
              <div className="text-sm font-semibold truncate">
                {song.title}
                {typeof song.likeCount === "number" && (
                  <span className="ml-1 text-xs text-purple-400">❤️ {song.likeCount}</span>
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
