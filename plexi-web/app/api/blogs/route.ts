import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import clientPromise from "@/lib/mongodb";
import { validateAdminToken } from "@/lib/admin-auth";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("plexi");
    const blogs = await db.collection("blogs").find({}).sort({ publishedAt: -1 }).toArray();
    return NextResponse.json(blogs);
  } catch (e) {
    console.error("GET /api/blogs error:", e);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // SEC-1: Require admin token for mutations
  if (!validateAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("plexi");

    // Remove _id if present to let Mongo generate a new one
    const { _id, ...blogData } = body;
    void _id; // explicitly unused

    const result = await db.collection("blogs").insertOne({
      ...blogData,
      publishedAt: blogData.publishedAt || Date.now(),
    });

    return NextResponse.json({ ...blogData, _id: result.insertedId });
  } catch (e) {
    console.error("POST /api/blogs error:", e);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
