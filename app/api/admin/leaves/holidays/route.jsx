export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const year      = searchParams.get('year') || new Date().getFullYear();
  const token     = request.cookies.get('authToken')?.value;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave/holidays?companyId=${companyId}&year=${year}`,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(request) {
  const token = request.cookies.get('authToken')?.value;
  const body  = await request.json();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave/holidays`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const holidayId = searchParams.get('holidayId');
  const companyId = searchParams.get('companyId');
  const token     = request.cookies.get('authToken')?.value;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave/holidays?holidayId=${holidayId}&companyId=${companyId}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
