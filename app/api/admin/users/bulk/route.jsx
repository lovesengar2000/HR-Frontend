export async function POST(request) {
  const token = request.cookies.get('authToken')?.value;
  const body = await request.json();
  // body: { companyId, employees: [ { name, email, department, designation, role, phone, dateOfJoining }, ... ] }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/employees/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Error bulk creating employees:', error);
    return Response.json({ error: 'Failed to bulk create employees' }, { status: 500 });
  }
}
