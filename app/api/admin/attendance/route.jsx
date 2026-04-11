export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const date = searchParams.get('date'); // optional YYYY-MM-DD filter
  const token = request.cookies.get('authToken')?.value;

  try {
    const params = new URLSearchParams({ companyId });
    if (date) params.set('date', date);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/attendance/admin?${params.toString()}`,
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
    console.error('Error fetching admin attendance:', error);
    return Response.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
  }
}
