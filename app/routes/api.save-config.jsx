import db from "../db.server";

// Handle CORS preflight requests
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
  });
};

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { shop, config } = body;

    if (!shop || !config) {
      return new Response(JSON.stringify({ error: "Missing required fields: shop, config" }), {
        status: 400,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const record = await db.orderConfig.create({
      data: { shop, config },
    });

    return new Response(JSON.stringify({ id: record.id }), {
      status: 200,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving order config:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
};

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
