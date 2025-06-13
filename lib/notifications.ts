import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/** 유저에게 간단한 텍스트 알림 전송 */
export async function sendNotification(toUserId: string, message: string) {
  const ref = collection(db, "users", toUserId, "notifications");
  await addDoc(ref, {
    message,
    createdAt: serverTimestamp(),   // iOS NotificationView에서 읽는 필드
  });
}
