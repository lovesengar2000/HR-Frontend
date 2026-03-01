export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const employeeId = searchParams.get("employeeId");

  const token = request.cookies.get("authToken")?.value;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave?companyId=${companyId}&employeeId=${employeeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const FetchDetails = await response.json();

    // Mock data for demonstration
    return new Response(JSON.stringify(FetchDetails), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching leave data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch leave data" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

export async function POST(request) {
  const body = await request.json();
  // Process the body, e.g., save to a database
  return new Response(JSON.stringify({ message: "User added", user: body }), {
    status: 201,
  });
}
