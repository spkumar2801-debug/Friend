import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { extractHashtags, extractMentions } from "./text";
import type {
  AppNotification,
  AuthorSnapshot,
  Comment,
  Conversation,
  Follow,
  Message,
  Post,
  PostMedia,
  Story,
  UserProfile,
  UserSettings,
} from "@/types";

export type Cursor = QueryDocumentSnapshot<DocumentData> | number | null;
export interface Page<T> {
  items: T[];
  cursor: Cursor;
  done: boolean;
}

/** Max documents fetched for index-free (client-sorted) listings. */
const SCAN = 120;

function offsetOf(cursor: Cursor) {
  return typeof cursor === "number" ? cursor : 0;
}

function newestFirst<T extends { createdAt?: unknown }>(items: T[]) {
  return [...items].sort(
    (a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0),
  );
}

function slicePage<T extends { createdAt?: unknown }>(
  all: T[],
  cursor: Cursor,
  size: number,
): Page<T> {
  const sorted = newestFirst(all);
  const start = offsetOf(cursor);
  const items = sorted.slice(start, start + size);
  const next = start + items.length;
  return { items, cursor: next, done: next >= sorted.length };
}


export const defaultSettings: UserSettings = {
  theme: "system",
  notifyLikes: true,
  notifyComments: true,
  notifyFollowers: true,
  notifyMessages: true,
  allowMessagesFrom: "everyone",
  showActivity: true,
};

export function toDate(ts: unknown): Date | null {
  if (ts instanceof Timestamp) return ts.toDate();
  return null;
}

/** Deeply removes undefined properties so Firestore never throws unsupported field value error. */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === "object" && !(data instanceof Date) && !(data instanceof Timestamp)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as unknown as T;
  }
  return data;
}

export function snapshotOf(profile: UserProfile): AuthorSnapshot {
  return {
    uid: profile.uid,
    username: profile.username ?? "",
    displayName: profile.displayName ?? profile.username ?? "",
    photoURL: profile.photoURL ?? null,
  };
}

/* ------------------------------------------------------------------ users */

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getDb(), "users", uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null;
}

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  const map = await getDoc(doc(getDb(), "usernames", username.toLowerCase()));
  if (map.exists()) return getProfile((map.data() as { uid: string }).uid);
  const res = await getDocs(
    query(collection(getDb(), "users"), where("usernameLower", "==", username.toLowerCase()), qLimit(1)),
  );
  const d = res.docs[0];
  return d ? ({ uid: d.id, ...d.data() } as UserProfile) : null;
}

export async function isUsernameAvailable(username: string, currentUid?: string) {
  const lower = username.toLowerCase();
  const snap = await getDoc(doc(getDb(), "usernames", lower));
  if (!snap.exists()) return true;
  return (snap.data() as { uid: string }).uid === currentUid;
}

export async function generateUsername(base: string) {
  const clean = base.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 18) || "friend";
  const padded = clean.length >= 3 ? clean : `${clean}user`;
  for (let i = 0; i < 12; i++) {
    const candidate = i === 0 ? padded : `${padded}${Math.floor(1000 + Math.random() * 9000)}`;
    if (await isUsernameAvailable(candidate)) return candidate;
  }
  return `${padded}${Date.now().toString().slice(-6)}`;
}

export async function createProfile(params: {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string | null;
}) {
  const db = getDb();
  const lower = params.username.toLowerCase();
  const batch = writeBatch(db);
  batch.set(doc(db, "users", params.uid), {
    username: params.username,
    usernameLower: lower,
    displayName: params.displayName,
    bio: "",
    website: "",
    photoURL: params.photoURL ?? null,
    photoPublicId: null,
    isPrivate: false,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    verified: false,
    settings: defaultSettings,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "usernames", lower), { uid: params.uid, createdAt: serverTimestamp() });
  await batch.commit();
}

export async function updateProfile(
  uid: string,
  patch: Partial<UserProfile>,
  previousUsername?: string,
) {
  const db = getDb();
  const batch = writeBatch(db);
  batch.update(doc(db, "users", uid), patch as DocumentData);
  if (patch.username && previousUsername && patch.username.toLowerCase() !== previousUsername.toLowerCase()) {
    batch.set(doc(db, "usernames", patch.username.toLowerCase()), {
      uid,
      createdAt: serverTimestamp(),
    });
    batch.delete(doc(db, "usernames", previousUsername.toLowerCase()));
  }
  await batch.commit();
}

export async function updateSettings(uid: string, settings: UserSettings) {
  await updateDoc(doc(getDb(), "users", uid), { settings });
}

export async function searchUsers(term: string, max = 12): Promise<UserProfile[]> {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const db = getDb();
  const byUsername = await getDocs(
    query(
      collection(db, "users"),
      orderBy("usernameLower"),
      where("usernameLower", ">=", t),
      where("usernameLower", "<=", `${t}\uf8ff`),
      qLimit(max),
    ),
  );
  const found = new Map<string, UserProfile>();
  byUsername.docs.forEach((d) => found.set(d.id, { uid: d.id, ...d.data() } as UserProfile));
  return [...found.values()];
}

export async function suggestedUsers(uid: string, followingIds: string[], max = 6) {
  const res = await getDocs(
    query(collection(getDb(), "users"), orderBy("followerCount", "desc"), qLimit(max + followingIds.length + 1)),
  );
  return res.docs
    .map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)
    .filter((u) => u.uid !== uid && !followingIds.includes(u.uid))
    .slice(0, max);
}

export async function getProfiles(uids: string[]): Promise<UserProfile[]> {
  if (!uids.length) return [];
  const db = getDb();
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
  const results = await Promise.all(
    chunks.map((chunk) =>
      getDocs(query(collection(db, "users"), where(documentId(), "in", chunk))),
    ),
  );
  return results.flatMap((r) => r.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile));
}

/* ---------------------------------------------------------------- follows */

const followId = (a: string, b: string) => `${a}_${b}`;

export async function getFollow(followerId: string, followingId: string): Promise<Follow | null> {
  const snap = await getDoc(doc(getDb(), "follows", followId(followerId, followingId)));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Follow) : null;
}

export async function follow(actor: UserProfile, target: UserProfile) {
  const db = getDb();
  const id = followId(actor.uid, target.uid);
  const status: Follow["status"] = target.isPrivate ? "pending" : "accepted";
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "follows", id);
    if ((await tx.get(ref)).exists()) return;
    tx.set(ref, {
      followerId: actor.uid,
      followingId: target.uid,
      status,
      createdAt: serverTimestamp(),
    });
    if (status === "accepted") {
      tx.update(doc(db, "users", actor.uid), { followingCount: increment(1) });
      tx.update(doc(db, "users", target.uid), { followerCount: increment(1) });
    }
  });
  await notify({
    userId: target.uid,
    actor: snapshotOf(actor),
    type: status === "accepted" ? "follow" : "follow_request",
  });
  return status;
}

export async function unfollow(actorId: string, targetId: string) {
  const db = getDb();
  const id = followId(actorId, targetId);
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "follows", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const accepted = (snap.data() as Follow).status === "accepted";
    tx.delete(ref);
    if (accepted) {
      tx.update(doc(db, "users", actorId), { followingCount: increment(-1) });
      tx.update(doc(db, "users", targetId), { followerCount: increment(-1) });
    }
  });
}

export async function respondToRequest(
  requesterId: string,
  ownerProfile: UserProfile,
  accept: boolean,
) {
  const db = getDb();
  const ref = doc(db, "follows", followId(requesterId, ownerProfile.uid));
  if (!accept) {
    await deleteDoc(ref);
    return;
  }
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    tx.update(ref, { status: "accepted" });
    tx.update(doc(db, "users", requesterId), { followingCount: increment(1) });
    tx.update(doc(db, "users", ownerProfile.uid), { followerCount: increment(1) });
  });
  await notify({
    userId: requesterId,
    actor: snapshotOf(ownerProfile),
    type: "follow_accepted",
  });
}

export async function followingIds(uid: string) {
  const res = await getDocs(
    query(collection(getDb(), "follows"), where("followerId", "==", uid)),
  );
  return res.docs
    .map((d) => d.data() as Follow)
    .filter((follow) => follow.status === "accepted")
    .map((follow) => follow.followingId);
}

export async function followerIds(uid: string) {
  const res = await getDocs(
    query(collection(getDb(), "follows"), where("followingId", "==", uid)),
  );
  return res.docs
    .map((d) => d.data() as Follow)
    .filter((follow) => follow.status === "accepted")
    .map((follow) => follow.followerId);
}

export async function pendingRequests(uid: string) {
  const res = await getDocs(
    query(collection(getDb(), "follows"), where("followingId", "==", uid)),
  );
  return res.docs
    .map((d) => d.data() as Follow)
    .filter((follow) => follow.status === "pending")
    .map((follow) => follow.followerId);
}

export async function removeFollower(ownerId: string, followerId: string) {
  await unfollow(followerId, ownerId);
}

/* ------------------------------------------------------------------ posts */

const postFrom = (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as Post;

export async function createPost(params: {
  author: UserProfile;
  media: PostMedia[];
  caption: string;
  location?: string | null;
}) {
  const db = getDb();
  const hashtags = extractHashtags(params.caption || "");
  const mentions = extractMentions(params.caption || "");
  const cleanMedia = (params.media || []).map((m) => {
    const item: PostMedia = {
      url: m.url,
      publicId: m.publicId,
      resourceType: m.resourceType,
      alt: m.alt ?? "",
    };
    if (typeof m.width === "number") item.width = m.width;
    if (typeof m.height === "number") item.height = m.height;
    if (typeof m.duration === "number") item.duration = m.duration;
    return item;
  });

  const postData = sanitizeForFirestore({
    authorId: params.author.uid,
    author: snapshotOf(params.author),
    media: cleanMedia,
    caption: (params.caption || "").slice(0, 2200),
    hashtags,
    mentions,
    location: params.location?.slice(0, 80) ?? null,
    likeCount: 0,
    commentCount: 0,
    repostCount: 0,
    isPrivate: Boolean(params.author.isPrivate),
    moderationStatus: "approved",
    createdAt: serverTimestamp(),
  });

  const ref = await addDoc(collection(db, "posts"), postData);
  await updateDoc(doc(db, "users", params.author.uid), { postCount: increment(1) });
  await Promise.all(
    hashtags.map((tag) =>
      setDoc(
        doc(db, "hashtags", tag),
        { tag, postCount: increment(1), updatedAt: serverTimestamp() },
        { merge: true },
      ),
    ),
  );
  await notifyMentions(mentions, params.author, ref.id, params.caption);
  return ref.id;
}

export async function deletePost(post: Post) {
  const db = getDb();
  const comments = await getDocs(query(collection(db, "posts", post.id, "comments"), qLimit(300)));
  const likes = await getDocs(query(collection(db, "posts", post.id, "likes"), qLimit(300)));
  const batch = writeBatch(db);
  comments.docs.forEach((d) => batch.delete(d.ref));
  likes.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "posts", post.id));
  batch.update(doc(db, "users", post.authorId), { postCount: increment(-1) });
  await batch.commit();
}

export async function getPost(id: string): Promise<Post | null> {
  const snap = await getDoc(doc(getDb(), "posts", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Post) : null;
}

export async function feedPage(uid: string, ids: string[], cursor: Cursor, size = 6): Promise<Page<Post>> {
  const authors = [uid, ...ids].slice(0, 10);
  const res = await getDocs(
    query(collection(getDb(), "posts"), where("authorId", "in", authors), qLimit(SCAN)),
  );
  return slicePage(res.docs.map(postFrom), cursor, size);
}

export async function discoverPage(cursor: Cursor, size = 12): Promise<Page<Post>> {
  const res = await getDocs(
    query(collection(getDb(), "posts"), where("isPrivate", "==", false), qLimit(SCAN)),
  );
  return slicePage(res.docs.map(postFrom), cursor, size);
}

export async function userPosts(uid: string, cursor: Cursor, size = 12): Promise<Page<Post>> {
  const res = await getDocs(
    query(collection(getDb(), "posts"), where("authorId", "==", uid), qLimit(SCAN)),
  );
  return slicePage(res.docs.map(postFrom), cursor, size);
}

export async function hashtagPosts(tag: string, cursor: Cursor, size = 12): Promise<Page<Post>> {
  const res = await getDocs(
    query(
      collection(getDb(), "posts"),
      where("hashtags", "array-contains", tag.toLowerCase()),
      qLimit(SCAN),
    ),
  );
  return slicePage(res.docs.map(postFrom), cursor, size);
}

export async function hashtagCount(tag: string) {
  const snap = await getDoc(doc(getDb(), "hashtags", tag.toLowerCase()));
  return snap.exists() ? ((snap.data() as { postCount?: number }).postCount ?? 0) : 0;
}

/* ------------------------------------------------------------------ likes */

export async function likedByMe(postId: string, uid: string) {
  const snap = await getDoc(doc(getDb(), "posts", postId, "likes", uid));
  return snap.exists();
}

export async function toggleLike(post: Post, actor: UserProfile, like: boolean) {
  const db = getDb();
  const ref = doc(db, "posts", post.id, "likes", actor.uid);
  await runTransaction(db, async (tx) => {
    const exists = (await tx.get(ref)).exists();
    if (like && !exists) {
      tx.set(ref, { uid: actor.uid, createdAt: serverTimestamp() });
      tx.update(doc(db, "posts", post.id), { likeCount: increment(1) });
    } else if (!like && exists) {
      tx.delete(ref);
      tx.update(doc(db, "posts", post.id), { likeCount: increment(-1) });
    }
  });
  if (like && post.authorId !== actor.uid) {
    await notify({ userId: post.authorId, actor: snapshotOf(actor), type: "like", postId: post.id });
  }
}

/* --------------------------------------------------------------- comments */

export async function commentPage(postId: string, cursor: Cursor, size = 10): Promise<Page<Comment>> {
  const db = getDb();
  const base = [
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "desc"),
  ] as const;
  const res = await getDocs(
    cursor ? query(...base, startAfter(cursor), qLimit(size)) : query(...base, qLimit(size)),
  );
  return {
    items: res.docs.map((d) => ({ id: d.id, postId, ...d.data() }) as Comment),
    cursor: res.docs.at(-1) ?? null,
    done: res.docs.length < size,
  };
}

export async function addComment(params: {
  post: Post;
  author: UserProfile;
  text: string;
  parentId?: string | null;
}) {
  const db = getDb();
  const ref = await addDoc(
    collection(db, "posts", params.post.id, "comments"),
    sanitizeForFirestore({
      authorId: params.author.uid,
      author: snapshotOf(params.author),
      text: params.text.slice(0, 1000),
      parentId: params.parentId ?? null,
      likeCount: 0,
      createdAt: serverTimestamp(),
    }),
  );
  await updateDoc(doc(db, "posts", params.post.id), { commentCount: increment(1) });
  if (params.post.authorId !== params.author.uid) {
    await notify({
      userId: params.post.authorId,
      actor: snapshotOf(params.author),
      type: params.parentId ? "reply" : "comment",
      postId: params.post.id,
      preview: params.text.slice(0, 120),
    });
  }
  await notifyMentions(extractMentions(params.text), params.author, params.post.id, params.text);
  return ref.id;
}

export async function deleteComment(postId: string, commentId: string) {
  const db = getDb();
  const batch = writeBatch(db);
  batch.delete(doc(db, "posts", postId, "comments", commentId));
  batch.update(doc(db, "posts", postId), { commentCount: increment(-1) });
  await batch.commit();
}

export async function toggleCommentLike(
  postId: string,
  commentId: string,
  uid: string,
  like: boolean,
) {
  const db = getDb();
  const ref = doc(db, "posts", postId, "comments", commentId, "likes", uid);
  await runTransaction(db, async (tx) => {
    const exists = (await tx.get(ref)).exists();
    if (like && !exists) {
      tx.set(ref, { uid, createdAt: serverTimestamp() });
      tx.update(doc(db, "posts", postId, "comments", commentId), { likeCount: increment(1) });
    } else if (!like && exists) {
      tx.delete(ref);
      tx.update(doc(db, "posts", postId, "comments", commentId), { likeCount: increment(-1) });
    }
  });
}

/* ------------------------------------------------------------------ saves */

export async function isSaved(uid: string, postId: string) {
  const snap = await getDoc(doc(getDb(), "users", uid, "saved", postId));
  return snap.exists();
}

export async function toggleSave(uid: string, postId: string, save: boolean) {
  const ref = doc(getDb(), "users", uid, "saved", postId);
  if (save) await setDoc(ref, { postId, createdAt: serverTimestamp() });
  else await deleteDoc(ref);
}

export async function savedPosts(uid: string, max = 24): Promise<Post[]> {
  const res = await getDocs(
    query(collection(getDb(), "users", uid, "saved"), orderBy("createdAt", "desc"), qLimit(max)),
  );
  const posts = await Promise.all(res.docs.map((d) => getPost(d.id)));
  return posts.filter((p): p is Post => Boolean(p));
}

/* ---------------------------------------------------------------- reposts */

export async function isReposted(uid: string, postId: string) {
  const snap = await getDoc(doc(getDb(), "users", uid, "reposts", postId));
  return snap.exists();
}

export async function toggleRepost(
  uid: string,
  postId: string,
  repost: boolean,
  post?: Post,
  actor?: UserProfile,
) {
  const db = getDb();
  const ref = doc(db, "users", uid, "reposts", postId);
  const postRef = doc(db, "posts", postId);
  if (repost) {
    await setDoc(ref, { postId, createdAt: serverTimestamp() });
    try {
      await updateDoc(postRef, { repostCount: increment(1) });
    } catch {
      // ignore
    }
    if (post && actor && post.authorId !== actor.uid) {
      await notify({
        userId: post.authorId,
        actor: snapshotOf(actor),
        type: "repost",
        postId: post.id,
      });
    }
  } else {
    await deleteDoc(ref);
    try {
      await updateDoc(postRef, { repostCount: increment(-1) });
    } catch {
      // ignore
    }
  }
}

export async function repostedPosts(uid: string, max = 24): Promise<Post[]> {
  const res = await getDocs(
    query(collection(getDb(), "users", uid, "reposts"), orderBy("createdAt", "desc"), qLimit(max)),
  );
  const posts = await Promise.all(res.docs.map((d) => getPost(d.id)));
  return posts.filter((p): p is Post => Boolean(p));
}

/* ---------------------------------------------------------------- stories */

export async function createStory(author: UserProfile, media: PostMedia) {
  const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
  const cleanMedia: PostMedia = {
    url: media.url,
    publicId: media.publicId,
    resourceType: media.resourceType,
    alt: media.alt ?? "",
  };
  if (typeof media.width === "number") cleanMedia.width = media.width;
  if (typeof media.height === "number") cleanMedia.height = media.height;
  if (typeof media.duration === "number") cleanMedia.duration = media.duration;

  await addDoc(collection(getDb(), "stories"), sanitizeForFirestore({
    authorId: author.uid,
    author: snapshotOf(author),
    media: cleanMedia,
    viewers: [],
    createdAt: serverTimestamp(),
    expiresAt,
  }));
}

export async function activeStories(authorIds: string[]): Promise<Story[]> {
  if (!authorIds.length) return [];
  const db = getDb();
  const chunks: string[][] = [];
  for (let i = 0; i < authorIds.length; i += 10) chunks.push(authorIds.slice(i, i + 10));
  const now = Timestamp.now();
  const res = await Promise.all(
    chunks.map((chunk) =>
      getDocs(
        query(
          collection(db, "stories"),
          where("authorId", "in", chunk),
          qLimit(SCAN),
        ),
      ),
    ),
  );
  return res
    .flatMap((r) => r.docs.map((d) => ({ id: d.id, ...d.data() }) as Story))
    .filter((story) => (toDate(story.expiresAt)?.getTime() ?? 0) > now.toMillis())
    .sort((a, b) => (toDate(a.createdAt)?.getTime() ?? 0) - (toDate(b.createdAt)?.getTime() ?? 0));
}

export async function markStoryViewed(storyId: string, uid: string) {
  const db = getDb();
  const ref = doc(db, "stories", storyId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const viewers = ((snap.data() as Story).viewers ?? []) as string[];
    if (!viewers.includes(uid)) tx.update(ref, { viewers: [...viewers, uid] });
  });
}

export async function deleteStory(storyId: string) {
  await deleteDoc(doc(getDb(), "stories", storyId));
}

/* ---------------------------------------------------------- notifications */

export async function notify(params: {
  userId: string;
  actor: AuthorSnapshot;
  type: AppNotification["type"];
  postId?: string | null;
  preview?: string | null;
}) {
  if (params.userId === params.actor.uid) return;
  try {
    await addDoc(
      collection(getDb(), "notifications"),
      sanitizeForFirestore({
        userId: params.userId,
        actorId: params.actor.uid,
        actor: params.actor,
        type: params.type,
        postId: params.postId ?? null,
        preview: params.preview ?? null,
        read: false,
        createdAt: serverTimestamp(),
      }),
    );
  } catch {
    /* notifications are best-effort and must never break the main action */
  }
}

async function notifyMentions(
  usernames: string[],
  actor: UserProfile,
  postId: string,
  preview: string,
) {
  await Promise.all(
    usernames.slice(0, 10).map(async (username) => {
      const target = await getProfileByUsername(username);
      if (target && target.uid !== actor.uid) {
        await notify({
          userId: target.uid,
          actor: snapshotOf(actor),
          type: "mention",
          postId,
          preview: preview.slice(0, 120),
        });
      }
    }),
  );
}

export function watchNotifications(uid: string, cb: (items: AppNotification[]) => void) {
  return onSnapshot(
    query(collection(getDb(), "notifications"), where("userId", "==", uid), qLimit(80)),
    (snap) =>
      cb(
        newestFirst(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification),
        ).slice(0, 40),
      ),
    () => cb([]),
  );
}

export async function markNotificationsRead(ids: string[]) {
  if (!ids.length) return;
  const db = getDb();
  const batch = writeBatch(db);
  ids.slice(0, 400).forEach((id) => batch.update(doc(db, "notifications", id), { read: true }));
  await batch.commit();
}

/* -------------------------------------------------------------- messaging */

export function conversationIdFor(a: string, b: string) {
  return [a, b].sort().join("__");
}

export async function openConversation(me: UserProfile, other: UserProfile) {
  const db = getDb();
  const id = conversationIdFor(me.uid, other.uid);
  const ref = doc(db, "conversations", id);
  if (!(await getDoc(ref)).exists()) {
    await setDoc(ref, {
      participants: [me.uid, other.uid],
      participantInfo: { [me.uid]: snapshotOf(me), [other.uid]: snapshotOf(other) },
      lastMessage: "",
      lastSenderId: null,
      unread: { [me.uid]: 0, [other.uid]: 0 },
      updatedAt: serverTimestamp(),
    });
  }
  return id;
}

export function watchConversations(uid: string, cb: (items: Conversation[]) => void) {
  return onSnapshot(
    query(collection(getDb(), "conversations"), where("participants", "array-contains", uid), qLimit(60)),
    (snap) =>
      cb(
        [...snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation)]
          .sort(
            (a, b) =>
              (toDate(b.updatedAt)?.getTime() ?? 0) - (toDate(a.updatedAt)?.getTime() ?? 0),
          )
          .slice(0, 30),
      ),
    () => cb([]),
  );
}

export function watchMessages(conversationId: string, cb: (items: Message[]) => void) {
  return onSnapshot(
    query(
      collection(getDb(), "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc"),
      qLimit(100),
    ),
    (snap) =>
      cb(snap.docs.map((d) => ({ id: d.id, conversationId, ...d.data() }) as Message)),
  );
}

export async function sendMessage(params: {
  conversationId: string;
  sender: UserProfile;
  recipientId: string;
  text: string;
  media?: PostMedia | null;
}) {
  const db = getDb();
  const text = params.text.trim().slice(0, 2000);
  if (!text && !params.media) return;
  await addDoc(collection(db, "conversations", params.conversationId, "messages"), {
    senderId: params.sender.uid,
    text,
    media: params.media ?? null,
    readBy: [params.sender.uid],
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "conversations", params.conversationId), {
    lastMessage: text || "Sent an attachment",
    lastSenderId: params.sender.uid,
    updatedAt: serverTimestamp(),
    [`unread.${params.recipientId}`]: increment(1),
  });
  await notify({
    userId: params.recipientId,
    actor: snapshotOf(params.sender),
    type: "message",
    preview: text.slice(0, 100),
  });
}

export async function markConversationRead(conversationId: string, uid: string) {
  try {
    await updateDoc(doc(getDb(), "conversations", conversationId), { [`unread.${uid}`]: 0 });
  } catch {
    /* ignore */
  }
}

/* --------------------------------------------------------- block & report */

export async function blockUser(uid: string, targetId: string) {
  await setDoc(doc(getDb(), "users", uid, "blocked", targetId), {
    targetId,
    createdAt: serverTimestamp(),
  });
  await unfollow(uid, targetId).catch(() => undefined);
  await unfollow(targetId, uid).catch(() => undefined);
}

export async function unblockUser(uid: string, targetId: string) {
  await deleteDoc(doc(getDb(), "users", uid, "blocked", targetId));
}

export async function blockedIds(uid: string) {
  const res = await getDocs(collection(getDb(), "users", uid, "blocked"));
  return res.docs.map((d) => d.id);
}

export async function reportContent(params: {
  reporterId: string;
  targetId: string;
  targetType: "post" | "comment" | "user" | "message";
  reason: string;
}) {
  await addDoc(collection(getDb(), "reports"), {
    ...params,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export async function canViewProfile(viewerUid: string | null, profile: UserProfile) {
  if (!profile.isPrivate) return true;
  if (!viewerUid) return false;
  if (viewerUid === profile.uid) return true;
  const rel = await getFollow(viewerUid, profile.uid);
  return rel?.status === "accepted";
}
