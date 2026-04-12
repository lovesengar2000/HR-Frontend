export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const token     = request.cookies.get('authToken')?.value;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave/policies?companyId=${companyId}`,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to fetch leave policies' }, { status: 500 });
  }
}

export async function POST(request) {
  const token = request.cookies.get('authToken')?.value;
  const body  = await request.json();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave/policies`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to create leave policy' }, { status: 500 });
  }
}

export async function PUT(request) {
  const token = request.cookies.get('authToken')?.value;
  const body  = await request.json();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave/policies`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to update leave policy' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const policyId  = searchParams.get('policyId');
  const companyId = searchParams.get('companyId');
  const token     = request.cookies.get('authToken')?.value;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave/policies?policyId=${policyId}&companyId=${companyId}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to delete leave policy' }, { status: 500 });
  }
}
