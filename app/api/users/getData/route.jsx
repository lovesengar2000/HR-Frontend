export async function GET(request) {
  try {
    const userdata = request.cookies.get("userData")?.value;
    return Response.json(userdata, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch user data" },
      { status: 500 },
    );
  }
}
