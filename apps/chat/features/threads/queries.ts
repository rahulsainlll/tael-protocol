import "server-only";
import { and, chatMessages, chatThreads, desc, eq, isNull } from "@tael/database";
import { db } from "../../lib/db";

const TITLE_MAX_LENGTH = 60;

/** Derive a short sidebar title from the thread's opening message. */
export function deriveTitle(firstMessage: string): string {
  const collapsed = firstMessage.replace(/\s+/g, " ").trim();
  if (collapsed.length <= TITLE_MAX_LENGTH) return collapsed || "New chat";
  return `${collapsed.slice(0, TITLE_MAX_LENGTH - 1)}…`;
}

/** Threads owned by `userId`, most recently active first — for the sidebar. */
export async function listThreads(userId: string) {
  return db
    .select({ id: chatThreads.id, title: chatThreads.title, updatedAt: chatThreads.updatedAt })
    .from(chatThreads)
    .where(eq(chatThreads.ownerId, userId))
    .orderBy(desc(chatThreads.updatedAt))
    .limit(50);
}

/** Create a new, untitled thread for `userId`. Titled lazily on first message. */
export async function createThread(userId: string) {
  const [thread] = await db.insert(chatThreads).values({ ownerId: userId }).returning();
  if (!thread) throw new Error("Failed to create thread.");
  return thread;
}

/**
 * Load a thread's full transcript, scoped to `userId` so one user can never
 * read another's thread by guessing an id. Returns null if not found/owned.
 */
export async function getThreadWithMessages(threadId: string, userId: string) {
  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.ownerId, userId)))
    .limit(1);
  if (!thread) return null;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, threadId))
    .orderBy(chatMessages.createdAt);

  return { thread, messages };
}

/** Confirm `userId` owns `threadId` without pulling the full transcript. */
export async function assertOwnsThread(threadId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.ownerId, userId)))
    .limit(1);
  return Boolean(row);
}

/** Append one message and bump the thread's `updatedAt` (sidebar ordering). */
export async function appendMessage(threadId: string, role: "user" | "assistant", content: string) {
  await db.insert(chatMessages).values({ threadId, role, content });
  await db.update(chatThreads).set({ updatedAt: new Date() }).where(eq(chatThreads.id, threadId));
}

/** Set the thread's title if it doesn't have one yet (first message only). */
export async function maybeSetTitle(threadId: string, firstMessage: string) {
  await db
    .update(chatThreads)
    .set({ title: deriveTitle(firstMessage) })
    .where(and(eq(chatThreads.id, threadId), isNull(chatThreads.title)));
}

export async function deleteThread(threadId: string, userId: string) {
  await db
    .delete(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.ownerId, userId)));
}
