"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  setDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";

function getStoragePathFromURL(fullURL: string): string | null {
  try {
    const decoded = decodeURIComponent(fullURL);
    const match = decoded.match(/\/o\/(.+)\?alt=media/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

interface Application {
  id: string;
  userId: string;
  nickname: string;
  profileImageURL: string;
  introduction: string;
  musicURLs: string[];
  createdAt: Timestamp;
  status?: "pending";
  canReapplyAfter?: Timestamp;
}

export default function ArtistApplicationsPage() {
  const [tab, setTab] = useState<'pending' | 'rejected'>('pending');
  const [applications, setApplications] = useState<Application[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'artistApplications'), (snap) => {
      setPendingCount(snap.size);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      if (tab === 'pending') {
        const q = query(collection(db, 'artistApplications'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];
        setApplications(items);
      } else {
        const snapshot = await getDocs(collection(db, 'rejectedArtistApplications'));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];
        setApplications(items);
      }
    };

    fetchApplications();
  }, [tab]);

  const sendNotification = async (userId: string, message: string) => {
    const notiRef = doc(collection(db, "users", userId, "notifications"));
    await setDoc(notiRef, {
      message,
      createdAt: Timestamp.now(),
    });
  };

  const approve = async (app: Application) => {
    const userRef = doc(db, "users", app.userId);

    await setDoc(
      userRef,
      {
        isArtist: true,
        artistLevel: "rookie",
        artistApplicationStatus: deleteField(),
      },
      { merge: true }
    );

    await deleteDoc(doc(db, "artistApplications", app.id));

    await sendNotification(app.userId, "🎉 아티스트 신청이 승인되었습니다!");

    if (app.musicURLs?.length) {
      for (const url of app.musicURLs) {
        const path = getStoragePathFromURL(url);
        if (path) await deleteObject(ref(storage, path)).catch(() => {});
      }
    }

    setApplications((prev) => prev.filter((a) => a.id !== app.id));
  };

  const reject = async (app: Application) => {
    const now = Timestamp.now();
    const canReapplyAfter = Timestamp.fromDate(new Date(Date.now() + 86_400_000));

    await setDoc(doc(db, "rejectedArtistApplications", app.userId), {
      userId: app.userId,
      nickname: app.nickname,
      profileImageURL: app.profileImageURL,
      introduction: app.introduction,
      musicURLs: app.musicURLs,
      createdAt: app.createdAt,
      rejectedAt: now,
      canReapplyAfter,
    });

    await setDoc(
      doc(db, "users", app.userId),
      {
        artistApplicationStatus: "rejected",
        rejectedAt: now,
      },
      { merge: true }
    );

    await deleteDoc(doc(db, "artistApplications", app.id));

    await sendNotification(app.userId, "😢 아티스트 신청이 거절되었습니다.");

    if (app.musicURLs?.length) {
      for (const url of app.musicURLs) {
        const path = getStoragePathFromURL(url);
        if (path) await deleteObject(ref(storage, path)).catch(() => {});
      }
    }

    setApplications((prev) => prev.filter((a) => a.id !== app.id));
  };

  const reapply = async (app: Application) => {
    await deleteDoc(doc(db, "rejectedArtistApplications", app.userId));

    await setDoc(doc(db, "artistApplications", app.id), {
      userId: app.userId,
      nickname: app.nickname,
      profileImageURL: app.profileImageURL,
      introduction: app.introduction,
      musicURLs: app.musicURLs,
      createdAt: Timestamp.now(),
      status: "pending",
    });

    await setDoc(doc(db, "users", app.userId), { artistApplicationStatus: "pending" }, { merge: true });

    alert("✅ 재신청이 완료되었습니다!");
    setApplications((prev) => prev.filter((a) => a.id !== app.id));
  };

  const deleteApplication = async (app: Application) => {
    const collectionName = tab === "pending" ? "artistApplications" : "rejectedArtistApplications";
    await deleteDoc(doc(db, collectionName, app.id));

    if (app.musicURLs?.length) {
      for (const url of app.musicURLs) {
        const path = getStoragePathFromURL(url);
        if (path) await deleteObject(ref(storage, path)).catch(() => {});
      }
    }

    setApplications((prev) => prev.filter((a) => a.id !== app.id));
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex gap-4 mb-6 relative">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-md relative ${tab === "pending" ? "bg-blue-600" : "bg-zinc-700"}`}
        >
          대기중
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("rejected")}
          className={`px-4 py-2 rounded-md ${tab === "rejected" ? "bg-blue-600" : "bg-zinc-700"}`}
        >
          거절됨
        </button>
      </div>

      {applications.length === 0 ? (
        <p className="text-gray-400">해당 항목이 없습니다.</p>
      ) : (
        <div className="space-y-8">
          {applications.map((app) => (
            <div key={app.id} className="bg-zinc-800 p-6 rounded-lg">
              <div className="flex items-center space-x-4 mb-4">
                <Image
                  src={app.profileImageURL || "/default-profile.png"}
                  alt="profile"
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="text-lg font-semibold">{app.nickname}</p>
                  <p className="text-sm text-gray-400">
                    {format(app.createdAt.toDate?.() || new Date(), "yyyy-MM-dd HH:mm", { locale: ko })}
                  </p>
                </div>
              </div>

              <p className="text-md mb-4 whitespace-pre-wrap">{app.introduction}</p>

              {app.musicURLs?.map((url, index) => (
                <audio key={index} controls className="mt-2 w-full">
                  <source src={url} type="audio/mp3" />
                  브라우저가 오디오를 지원하지 않습니다.
                </audio>
              ))}

              {tab === "pending" && (
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={() => approve(app)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => reject(app)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => deleteApplication(app)}
                    className="bg-zinc-600 hover:bg-zinc-700 px-4 py-2 rounded-md"
                  >
                    삭제
                  </button>
                </div>
              )}

              {tab === "rejected" && (
                <div className="mt-4 flex justify-between items-center">
                  {(() => {
                    const canReapplyTime = app.canReapplyAfter?.toDate();
                    return canReapplyTime && canReapplyTime <= new Date();
                  })() ? (
                    <button
                      onClick={() => reapply(app)}
                      className="bg-yellow-500 hover:bg-yellow-600 px-4 py-1 rounded-md text-sm"
                    >
                      재신청
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400">
                      ⏳ 재신청까지 남은 시간:{" "}
                      {format(app.canReapplyAfter?.toDate() || new Date(), "MM/dd HH:mm", {
                        locale: ko,
                      })}
                    </p>
                  )}
                  <button
                    onClick={() => deleteApplication(app)}
                    className="bg-zinc-600 hover:bg-zinc-700 px-4 py-1 rounded-md text-sm"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
