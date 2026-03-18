import { NextResponse } from "next/server";

export const revalidate = 0;

export function GET() {
  return NextResponse.json({ ok: true });
}
