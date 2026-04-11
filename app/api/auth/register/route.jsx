import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();


    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || data.error || "Registration failed" },
        { status: response.status }
      );
    }

    const outResponse = NextResponse.json({
      success: true,
      token: data.token,
      userId: data.userId,
      companyId: data.companyId,
      role: "COMPANY_ADMIN",
    });

    outResponse.cookies.set("authToken", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    outResponse.cookies.set("userData", JSON.stringify(data), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    return outResponse;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to reach authentication server" },
      { status: 500 }
    );
  }
}
