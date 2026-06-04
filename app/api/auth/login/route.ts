import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, generateSessionToken } from "@/lib/auth-token";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const validUser = process.env.AUTH_USERNAME ?? "admin";
  const validPass = process.env.AUTH_PASSWORD ?? "gl8fx2024";

  if (username !== validUser || password !== validPass) {
    return NextResponse.json(
      { error: "Грешно потребителско име или парола" },
      { status: 401 }
    );
  }

  const token = await generateSessionToken();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
