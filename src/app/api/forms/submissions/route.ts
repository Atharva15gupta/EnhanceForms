import { db } from "@/db"; 
import { forms, submissions } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    if (!formId || isNaN(Number(formId))) {
      return NextResponse.json({ success: false, message: "Invalid Form ID" }, { status: 400 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "User not authenticated" }, { status: 401 });
    }

    const ownedForm = await db
      .select({ id: forms.id })
      .from(forms)
      .where(and(eq(forms.id, Number(formId)), eq(forms.ownerId, user.id)))
      .limit(1);

    if (ownedForm.length === 0) {
      return NextResponse.json({ success: false, message: "Form not found" }, { status: 404 });
    }

    const responses = await db
      .select()
      .from(submissions)
      .where(eq(submissions.formId, Number(formId)));

    return NextResponse.json({ success: true, data: responses });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" });
  }
}
