import { NextRequest, NextResponse } from "next/server";

// Read at request time — never baked at build
const backendUrl = () =>
  (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");

type RouteParams = { params: Promise<{ path: string[] }> };

/** Forward these headers from the browser to the backend */
const FORWARDED_HEADERS = ["authorization", "x-real-ip", "x-forwarded-for"];

function pickHeaders(req: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  FORWARDED_HEADERS.forEach((h) => {
    const v = req.headers.get(h);
    if (v) out[h] = v;
  });
  return out;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const target = `${backendUrl()}/api/${path.join("/")}${req.nextUrl.search}`;

  try {
    const res = await fetch(target, {
      cache: "no-store",
      headers: pickHeaders(req),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unreachable", detail: String(err), target },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const target = `${backendUrl()}/api/${path.join("/")}`;
  const headers = pickHeaders(req);

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let body: BodyInit;

    if (contentType.includes("multipart/form-data")) {
      // PDF upload — forward raw FormData (fetch sets correct content-type boundary)
      body = await req.formData();
    } else {
      // JSON body (e.g. Stripe checkout, future JSON endpoints)
      const text = await req.text();
      body = text;
      if (text) headers["content-type"] = "application/json";
    }

    const res = await fetch(target, { method: "POST", body, headers });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unreachable", detail: String(err), target },
      { status: 502 },
    );
  }
}
