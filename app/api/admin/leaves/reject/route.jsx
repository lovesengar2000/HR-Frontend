export async function POST(request) {
  const token = request.cookies.get('authToken')?.value;
  const body = await request.json();
  // body: { leaveId, companyId, reason }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leave/${body.leaveId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyId: body.companyId, reason: body.reason }),
      }
    );
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    return Response.json({ error: 'Failed to reject leave' }, { status: 500 });
  }
}
