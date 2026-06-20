import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, phoneNumber, password } = await req.json();

    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phoneNumber, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Registration failed" }, { status: response.status });
    }

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration proxy error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
