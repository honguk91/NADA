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
import { sendNotification } from "@/lib/notifications";


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
  userId: string; 
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

export async function approveSong(id: string, title: string, userId: string) {
  await updateDoc(doc(db, "songs", id), {
    isPending: false,
    isVisible: true,
    isDeleted: false,
  });
  await sendNotification(userId, `🎵 '${title}' 업로드가 승인되었습니다!`);
}

export async function rejectSong(id: string, title: string, userId: string) {
  await updateDoc(doc(db, "songs", id), {
    isPending: false,
    isVisible: false,
    isDeleted: true,
  });
  await sendNotification(userId, `❌ '${title}' 업로드가 반려되었습니다.`);
}

export async function pauseSong(id: string, title: string, userId: string) {
  await updateDoc(doc(db, "songs", id), {
    isVisible: false,
  });

  await sendNotification(userId, `⏸️ '${title}' 가 정지되었습니다.`);
}


export async function deleteSong(
  id: string,
  title: string,
  userId: string,
  hardDelete = false
) {
  const songRef = doc(db, "songs", id);

  if (hardDelete) {
    await deleteDoc(songRef);
    await sendNotification(userId, `❌ '${title}' 가 완전히 삭제되었습니다.`);
  } else {
    await updateDoc(songRef, {
      isDeleted: true,
      isVisible: false,
    });
    await sendNotification(userId, `🗑️ '${title}' 가 삭제되었습니다.`);
  }
}



export async function restoreSong(id: string, title: string, userId: string) {
  await updateDoc(doc(db, "songs", id), {
    isDeleted: false,
    isVisible: true,
    isPending: false,
  });

  await sendNotification(userId, `🎵 '${title}' 가 복원되었습니다.`);
}


