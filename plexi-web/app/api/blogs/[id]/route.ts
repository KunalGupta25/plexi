import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { validateAdminToken } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("plexi");
    const isValidObjectId = id.length === 24 && /^[a-f\d]{24}$/i.test(id);
    const orClauses: Record<string, unknown>[] = [{ id }];
    if (isValidObjectId) orClauses.unshift({ _id: new ObjectId(id) });
    const blog = await db.collection("blogs").findOne({ $or: orClauses });

    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    return NextResponse.json(blog);
  } catch (e) {
    console.error("GET /api/blogs/[id] error:", e);
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  // SEC-1: Require admin token for mutations
  if (!validateAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { _id, ...updateData } = body;
    void _id;
    const client = await clientPromise;
    const db = client.db("plexi");

    const result = await db.collection("blogs").updateOne(
      {
        $or: [
          { _id: id.length === 24 ? new ObjectId(id) : null },
          { id },
        ].filter(Boolean) as Parameters<typeof db.collection>[0][],
      },
      { $set: updateData }
    );

    return NextResponse.json({ success: true, matchedCount: result.matchedCount });
  } catch (e) {
    console.error("PATCH /api/blogs/[id] error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  // SEC-1: Require admin token for mutations
  if (!validateAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("plexi");

    await db.collection("blogs").deleteOne({
      $or: [
        { _id: id.length === 24 ? new ObjectId(id) : null },
        { id },
      ].filter(Boolean) as Parameters<typeof db.collection>[0][],
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/blogs/[id] error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
