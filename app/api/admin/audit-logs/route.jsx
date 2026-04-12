export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const page      = searchParams.get('page') || '1';
  const limit     = searchParams.get('limit') || '50';
  const action    = searchParams.get('action') || '';
  const token     = request.cookies.get('authToken')?.value;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/audit-logs?companyId=${companyId}&page=${page}&limit=${limit}&action=${action}`,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
