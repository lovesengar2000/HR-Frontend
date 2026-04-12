export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const token     = request.cookies.get('authToken')?.value;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/performance/cycles?companyId=${companyId}`,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to fetch review cycles' }, { status: 500 });
  }
}

export async function POST(request) {
  const token = request.cookies.get('authToken')?.value;
  const body  = await request.json();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/performance/cycles`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to create review cycle' }, { status: 500 });
  }
}

export async function PUT(request) {
  const token = request.cookies.get('authToken')?.value;
  const body  = await request.json();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/performance/cycles`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to update review cycle' }, { status: 500 });
  }
}
