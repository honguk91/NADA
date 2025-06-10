export interface User {
  id: string;
  nickname: string;
  profileImageURL?: string;
  isSuspended?: boolean;
  isBanned?: boolean;
  [key: string]: any;
}
