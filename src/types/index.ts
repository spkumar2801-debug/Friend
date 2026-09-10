import type { Timestamp } from "firebase/firestore";

export interface AuthorSnapshot {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
}

export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  bio: string;
  website: string;
  photoURL: string | null;
  photoPublicId: string | null;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  verified: boolean;
  settings: UserSettings;
  createdAt: Timestamp | null;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyFollowers: boolean;
  notifyMessages: boolean;
  allowMessagesFrom: "everyone" | "followers";
  showActivity: boolean;
}

export interface PostMedia {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: AuthorSnapshot;
  media: PostMedia[];
  caption: string;
  hashtags: string[];
  mentions: string[];
  location: string | null;
  likeCount: number;
  commentCount: number;
  isPrivate: boolean;
  moderationStatus: "pending" | "approved" | "flagged" | "removed";
  createdAt: Timestamp | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: AuthorSnapshot;
  text: string;
  parentId: string | null;
  likeCount: number;
  createdAt: Timestamp | null;
}

export interface Story {
  id: string;
  authorId: string;
  author: AuthorSnapshot;
  media: PostMedia;
  viewers: string[];
  createdAt: Timestamp | null;
  expiresAt: Timestamp;
}

export type NotificationType =
  | "follow"
  | "follow_request"
  | "follow_accepted"
  | "like"
  | "comment"
  | "reply"
  | "mention"
  | "message";

export interface AppNotification {
  id: string;
  userId: string;
  actorId: string;
  actor: AuthorSnapshot;
  type: NotificationType;
  postId: string | null;
  preview: string | null;
  read: boolean;
  createdAt: Timestamp | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantInfo: Record<string, AuthorSnapshot>;
  lastMessage: string;
  lastSenderId: string | null;
  unread: Record<string, number>;
  updatedAt: Timestamp | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  media: PostMedia | null;
  readBy: string[];
  createdAt: Timestamp | null;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  status: "accepted" | "pending";
  createdAt: Timestamp | null;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: "post" | "comment" | "user" | "message";
  reason: string;
  status: "open" | "reviewing" | "closed";
  createdAt: Timestamp | null;
}
