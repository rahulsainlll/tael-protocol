import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../features/auth/current-user";
import { deleteThread, getThreadWithMessages } from "../../../../features/threads/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { threadId } = await params;
  const result = await getThreadWithMessages(threadId, user.id);
  if (!result) return NextResponse.json({ error: "Thread not found." }, { status: 404 });

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { threadId } = await params;
  await deleteThread(threadId, user.id);
  return NextResponse.json({ ok: true });
}