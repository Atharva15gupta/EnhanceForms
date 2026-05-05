import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const _user = await currentUser();

    if (!_user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, _user.id))
      .limit(1);

    if (!user || user.length === 0) {
      const email = _user.emailAddresses?.length > 0 ? _user.emailAddresses[0].emailAddress : "";

      try {
        await db.insert(users).values({
          id: _user.id,
          name: _user.firstName || "Unknown",
          email: email,
          image: _user.imageUrl || "https://default-avatar.com/avatar.png",
          plan: "Basic",
        });
      } catch (insertError) {
        console.error("Ignored insert error (possible webhook race condition):", insertError);
      }

      return NextResponse.json({
        createdForms: 0,
        totalSubmissions: 0,
        plan: "Basic",
      });
    }

    return NextResponse.json({
      createdForms: user[0].createdForms,
      totalSubmissions: user[0].totalSubmissions,
      plan: user[0].plan,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
