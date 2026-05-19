import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { forms } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const formId = searchParams.get("formId");

  if (!formId || isNaN(Number(formId))) {
    return NextResponse.json({ success: false, error: "Form ID is required" }, { status: 400 });
  }

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    const updatedForm = await db
      .update(forms)
      .set({ content })
      .where(and(eq(forms.id, Number(formId)), eq(forms.ownerId, user.id)))
      .returning({ id: forms.id });

    if (updatedForm.length === 0) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Form updated successfully" });
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
