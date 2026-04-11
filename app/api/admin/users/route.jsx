export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const token = request.cookies.get('authToken')?.value;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/employees?companyId=${companyId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return Response.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
