import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { forms } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    if (!formId || isNaN(Number(formId))) {
      return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { enabled } = await req.json();

    const updatedForm = await db
      .update(forms)
      .set({ receiveSubmissionEmails: Boolean(enabled) })
      .where(and(eq(forms.id, Number(formId)), eq(forms.ownerId, user.id)))
      .returning({ id: forms.id });

    if (updatedForm.length === 0) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Preference updated" });
  } catch (error) {
    console.error("Failed to update email notification preference:", error);
    return NextResponse.json({ error: "Failed to update preference" }, { status: 500 });
  }
}
