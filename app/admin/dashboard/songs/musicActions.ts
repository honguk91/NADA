import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

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

export async function fetchSongsByStatus(
  status: "pending" | "approved" | "paused" | "deleted"
): Promise<Song[]> {
  const baseQuery = collection(db, "songs");
  let q;

  switch (status) {
    case "pending":
      q = query(
        baseQuery,
        where("isPending", "==", true),
        where("isDeleted", "==", false)
      );
      break;
    case "approved":
      q = query(
        baseQuery,
        where("isPending", "==", false),
        where("isVisible", "==", true),
        where("isDeleted", "==", false)
      );
      break;
    case "paused":
      q = query(
        baseQuery,
        where("isPending", "==", false),
        where("isVisible", "==", false),
        where("isDeleted", "==", false)
      );
      break;
    case "deleted":
      q = query(baseQuery, where("isDeleted", "==", true));
      break;
    default:
      throw new Error("Invalid status");
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Song[];
}

export async function approveSong(id: string) {
  await updateDoc(doc(db, "songs", id), {
    isPending: false,
    isVisible: true,
    isDeleted: false,
  });
}

export async function rejectSong(id: string) {
  await updateDoc(doc(db, "songs", id), {
    isPending: false,
    isVisible: false,
    isDeleted: true,
  });
}

export async function pauseSong(id: string) {
  await updateDoc(doc(db, "songs", id), {
    isVisible: false,
  });
}

export async function deleteSong(id: string, hardDelete = false) {
  const songRef = doc(db, "songs", id);

  if (hardDelete) {
    // 완전 삭제 (문서 자체를 삭제)
    await deleteDoc(songRef);
  } else {
    // 일반 삭제 처리 (isDeleted 표시)
    await updateDoc(songRef, {
      isDeleted: true,
      isVisible: false,
    });
  }
}


export async function restoreSong(id: string) {
  await updateDoc(doc(db, "songs", id), {
    isDeleted: false,
    isVisible: true,
    isPending: false,
  });
}