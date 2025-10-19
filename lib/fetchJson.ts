export async function fetchJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);
    const raw = await res.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { }

    console.log("[fetchJson] URL:", typeof input === "string" ? input : (input as any)?.url);
    console.log("[fetchJson] Status:", res.status);
    console.log("[fetchJson] Raw:", raw);

    if (!res.ok) {
        const msg = data?.message
            ? Array.isArray(data.message) ? data.message.join(" | ") : String(data.message)
            : `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data as T;
}
