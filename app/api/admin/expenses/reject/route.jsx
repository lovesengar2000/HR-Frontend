export async function POST(request) {
  const token = request.cookies.get('authToken')?.value;
  const body = await request.json();
  // body: { expenseId, companyId, reason }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/expense/${body.expenseId}/reject`,
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
    console.error('Error rejecting expense:', error);
    return Response.json({ error: 'Failed to reject expense' }, { status: 500 });
  }
}
