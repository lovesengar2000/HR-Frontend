export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId  = searchParams.get("companyId");
  const employeeId = searchParams.get("employeeId");
  const token      = request.cookies.get("authToken")?.value;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/finance/tax?companyId=${companyId}&employeeId=${employeeId}`,
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
    console.error("Error fetching tax data:", error);
    return Response.json({ error: "Failed to fetch tax data" }, { status: 500 });
  }
}

export async function POST(request) {
  const token = request.cookies.get("authToken")?.value;
  const body  = await request.json();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/finance/tax/regime`,
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
    console.error("Error saving tax regime:", error);
    return Response.json({ error: "Failed to save tax regime" }, { status: 500 });
  }
}
