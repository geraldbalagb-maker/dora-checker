import { NextRequest, NextResponse } from "next/server";

// Read at request time — never baked at build
const backendUrl = () =>
  (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const target = `${backendUrl()}/api/${path.join("/")}${req.nextUrl.search}`;

  try {
    const res = await fetch(target, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unreachable", detail: String(err), target },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const target = `${backendUrl()}/api/${path.join("/")}`;

  try {
    const formData = await req.formData();
    const res = await fetch(target, { method: "POST", body: formData });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unreachable", detail: String(err), target },
      { status: 502 }
    );
  }
}
