import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { users } from "./users";

/** Who authored a chat message. Mirrors the two roles the chat UI renders. */
export const chatMessageRole = pgEnum("chat_message_role", ["user", "assistant"]);

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: primaryId(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /**
     * Short label shown in the sidebar. Null until the first message lands,
     * at which point the thread is titled from it (see
     * features/threads/queries.ts's `deriveTitle`) — so an abandoned empty
     * thread never clutters the sidebar with a title before there's
     * anything to summarize.
     */
    title: text("title"),
    ...timestamps,
  },
  (table) => [index("chat_threads_owner_id_idx").on(table.ownerId, table.updatedAt)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: primaryId(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    role: chatMessageRole("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("chat_messages_thread_id_idx").on(table.threadId, table.createdAt)],
);

export type ChatThread = typeof chatThreads.$inferSelect;
export type NewChatThread = typeof chatThreads.$inferInsert;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
export type NewChatMessageRow = typeof chatMessages.$inferInsert;
