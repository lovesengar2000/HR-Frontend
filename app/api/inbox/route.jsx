export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const companyId  = searchParams.get("companyId");
  const token      = request.cookies.get("authToken")?.value;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/inbox?employeeId=${employeeId}&companyId=${companyId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return Response.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}
