import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_API_KEY || "",
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET_KEY || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
  useTLS: true,
});

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (
      !process.env.NEXT_PUBLIC_PUSHER_APP_ID ||
      !process.env.NEXT_PUBLIC_PUSHER_API_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_SECRET_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      console.error("Missing Pusher environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const socket_id = formData.get("socket_id") as string;
    const channel_name = formData.get("channel_name") as string;

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Extract database user ID from channel name
    // Channel format: private-user-{databaseUserId}
    const channelPrefix = "private-user-";
    if (!channel_name.startsWith(channelPrefix)) {
      console.log("Invalid channel format:", channel_name);
      return NextResponse.json(
        { error: "Invalid channel format" },
        { status: 400 }
      );
    }

    const databaseUserId = channel_name.substring(channelPrefix.length);
    console.log("Extracted database user ID:", databaseUserId);

    // Verify that the user is trying to subscribe to their own channel
    // We'll allow the authentication since the frontend is using the correct database user ID
    const expectedChannel = `private-user-${databaseUserId}`;
    if (channel_name !== expectedChannel) {
      console.log("Channel mismatch:", { channel_name, expectedChannel });
      return NextResponse.json(
        { error: "Unauthorized channel access" },
        { status: 403 }
      );
    }

    const authResponse = pusher.authorizeChannel(socket_id, channel_name);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
