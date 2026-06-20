import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).backendToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { username, profilePicture, wallpaper } = await req.json();
    const token = (session.user as any).backendToken;

    const response = await fetch("http://localhost:5000/api/user/settings", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ username, profilePicture, wallpaper }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to update settings" }, { status: response.status });
    }

    return NextResponse.json({ message: "Settings updated successfully", user: data.user }, { status: 200 });
  } catch (error) {
    console.error("Update settings proxy error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
