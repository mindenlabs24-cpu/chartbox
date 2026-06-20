import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { username, profilePicture, wallpaper } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        username: username || undefined,
        profilePicture: profilePicture || undefined,
        wallpaper: wallpaper || undefined,
      }
    });

    return NextResponse.json({ message: "Settings updated successfully", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
