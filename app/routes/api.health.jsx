// Health check endpoint for Railway
export const loader = async () => {
  return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
