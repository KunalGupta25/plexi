import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("plexi");
    const notes = await db.collection("release_notes")
      .find({})
      .sort({ publishedAt: -1 })
      .limit(1)
      .toArray();
      
    return NextResponse.json(notes[0] || null);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch release notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("plexi");
    
    // Overwrite existing: Delete all old notes
    await db.collection("release_notes").deleteMany({});
    
    const newNote = {
      content: body.content,
      buttonText: body.buttonText,
      buttonUrl: body.buttonUrl,
      publishedAt: Date.now(),
      version: body.version || "1.0.0",
    };
    
    const result = await db.collection("release_notes").insertOne(newNote);
    return NextResponse.json({ ...newNote, _id: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: "Failed to publish release notes" }, { status: 500 });
  }
}
