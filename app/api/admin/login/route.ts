import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const correctPin = process.env.ADMIN_PIN;
  const secret = process.env.ADMIN_SECRET;

  if (!correctPin || !secret || pin !== correctPin) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 horas
    path: "/",
  });
  return res;
}
