import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("plexi");
    const blogs = await db.collection("blogs").find({}).sort({ publishedAt: -1 }).toArray();
    return NextResponse.json(blogs);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("plexi");
    
    // Remove _id if it's there to let Mongo generate a new one, or use it if provided
    const { _id, ...blogData } = body;
    
    const result = await db.collection("blogs").insertOne({
      ...blogData,
      publishedAt: blogData.publishedAt || Date.now(),
    });
    
    return NextResponse.json({ ...blogData, _id: result.insertedId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
