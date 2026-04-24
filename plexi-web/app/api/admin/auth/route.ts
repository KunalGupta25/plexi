import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Check against the server-side environment variable
    const masterPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    
    if (!masterPassword) {
      console.error("ADMIN_PASSWORD environment variable is not set!");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    
    if (password === masterPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
