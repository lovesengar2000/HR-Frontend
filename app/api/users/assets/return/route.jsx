export async function POST(request) {
  const token = request.cookies.get("authToken")?.value;
  const body  = await request.json();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/asset/return`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Error submitting return request:", error);
    return Response.json({ error: "Failed to submit return request" }, { status: 500 });
  }
}
