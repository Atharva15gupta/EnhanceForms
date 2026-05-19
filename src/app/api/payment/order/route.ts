import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    await req.json().catch(() => null);
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    const order = await razorpay.orders.create({
      amount: 499 * 100,
      currency: "INR",
      receipt: `receipt_${user.id}`,
      payment_capture: true,
      notes: { userId: user.id },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order Error:", error);
    return NextResponse.json({ success: false, message: "Order creation failed" }, { status: 500 });
  }
}

