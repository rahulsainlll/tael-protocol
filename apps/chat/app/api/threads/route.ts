import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { getCurrentUser } from "../../../features/auth/current-user";
import { createThread, listThreads } from "../../../features/threads/queries";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const threads = await listThreads(user.id);
  return NextResponse.json({ threads });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const thread = await createThread(user.id);
  return NextResponse.json({ thread });
}
