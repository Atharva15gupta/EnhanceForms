import { db } from "@/db"; 
import { forms } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url); 
    const formId = searchParams.get('formId'); 

    if (!formId || isNaN(Number(formId))) {
      return NextResponse.json({ success: false, message: "Invalid Form ID" }, { status: 400 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "User not authenticated" }, { status: 401 });
    }

    const existingForm = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, Number(formId)), eq(forms.ownerId, user.id)));

    if (existingForm.length === 0) {
      return NextResponse.json({ success: false, message: "Form not found" }, { status: 404 });
    }

    await db
      .delete(forms)
      .where(and(eq(forms.id, Number(formId)), eq(forms.ownerId, user.id)));

    return NextResponse.json({ success: true, message: "Form deleted successfully" });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" });
  }
}
