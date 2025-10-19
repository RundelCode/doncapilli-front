import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: "access_token",
    value: "",
    path: "/",
    maxAge: 0,
  });

  console.log("[API LOGOUT] Sesión cerrada ✅");

  return NextResponse.json({ ok: true });
}
