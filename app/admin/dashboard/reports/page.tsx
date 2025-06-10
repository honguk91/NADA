'use client';

import { useState } from 'react';
import PostReportList from './PostReportList';
import GuiltyReportList from './GuiltyReportList'; 
import CommentReportList from './CommentReportList';
import SongReportList from './SongReportList';

const tabs = ['글 신고', '댓글 신고', '곡 신고', '유죄'];

export default function ReportsPage() {
  const [selectedTab, setSelectedTab] = useState('글 신고');

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">🚨 관리자 - 신고 관리</h1>

      {/* 탭 메뉴 */}
      <div className="flex gap-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${
              selectedTab === tab
                ? 'bg-red-600'
                : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 내용 */}
      {selectedTab === '글 신고' && <PostReportList />}
      {selectedTab === '댓글 신고' && <CommentReportList />}
      {selectedTab === '곡 신고' && <SongReportList />}
      {selectedTab === '유죄' && <GuiltyReportList />} 
    </div>
  );
}
