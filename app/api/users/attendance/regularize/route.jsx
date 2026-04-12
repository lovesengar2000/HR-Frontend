export async function POST(request) {
  try {
    const body  = await request.json();
    const token = request.cookies.get('authToken')?.value;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/attendance/regularize`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: 'Failed to submit regularization' }, { status: 500 });
  }
}
