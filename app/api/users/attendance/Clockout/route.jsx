export async function POST(request) {
  try {
    const { companyId, employeeId } = await request.json();
    const token = request.cookies.get('authToken')?.value;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/attendance/clockout?companyId=${companyId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employeeId }),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to clock out' }, { status: 500 });
  }
}
