import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const body = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    console.log("[API LOGIN] Body recibido:", body);
    console.log("[API LOGIN] Base URL:", baseUrl);

    try {
        const r = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        console.log("[API LOGIN] Status backend:", r.status);
        const raw = await r.text();
        console.log("[API LOGIN] Respuesta raw backend:", raw);

        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch (err) {
            console.error("[API LOGIN] Error parseando JSON:", err);
        }

        if (!r.ok) {
            const msg = data?.message
                ? Array.isArray(data.message) ? data.message.join(" | ") : String(data.message)
                : `HTTP ${r.status}`;
            console.error("[API LOGIN] Error en backend:", msg);
            return NextResponse.json({ message: msg }, { status: r.status });
        }

        const token: string | undefined = data?.session?.access_token;
        console.log("[API LOGIN] Token recibido:", token);

        if (!token) {
            console.error("[API LOGIN] No se recibió token en la respuesta");
            return NextResponse.json({ message: "No se recibió token de acceso" }, { status: 500 });
        }

        const cookieStore = await cookies();
        cookieStore.set({
            name: "access_token",
            value: token,
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
        });

        console.log("[API LOGIN] Token guardado en cookies ✅");

        return NextResponse.json({ ok: true, hasToken: true });
    } catch (err) {
        console.error("[API LOGIN] Error en conexión:", err);
        return NextResponse.json({ message: "Error de conexión con el backend" }, { status: 502 });
    }
}
