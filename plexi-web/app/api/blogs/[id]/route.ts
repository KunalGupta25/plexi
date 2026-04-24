import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("plexi");
    const blog = await db.collection("blogs").findOne({ 
      $or: [
        { _id: id.length === 24 ? new ObjectId(id) : null },
        { id: id } // Fallback for custom string IDs
      ].filter(Boolean) as any
    });
    
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    return NextResponse.json(blog);
  } catch (e) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { _id, ...updateData } = body;
    const client = await clientPromise;
    const db = client.db("plexi");
    
    const result = await db.collection("blogs").updateOne(
      { 
        $or: [
          { _id: id.length === 24 ? new ObjectId(id) : null },
          { id: id }
        ].filter(Boolean) as any
      },
      { $set: updateData }
    );
    
    return NextResponse.json({ success: true, matchedCount: result.matchedCount });
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("plexi");
    
    await db.collection("blogs").deleteOne({ 
      $or: [
        { _id: id.length === 24 ? new ObjectId(id) : null },
        { id: id }
      ].filter(Boolean) as any
    });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
