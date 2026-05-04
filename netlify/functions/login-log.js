exports.handler = async function (event) {
  const { connectLambda, getStore } = await import("@netlify/blobs");

  // Important: this configures Netlify Blobs inside classic Netlify Functions.
  connectLambda(event);

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    const store = getStore("fcldc-login-logs");
    const key = "records.json";

    if (event.httpMethod === "GET") {
      const records = await store.get(key, { type: "json" });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          records: Array.isArray(records) ? records : []
        })
      };
    }

    if (event.httpMethod === "POST") {
      const incoming = JSON.parse(event.body || "{}");

      const record = {
        username: incoming.username || incoming.user || "unknown",
        user: incoming.username || incoming.user || "unknown",
        action: incoming.action || "UNKNOWN",
        timestamp: incoming.timestamp || new Date().toISOString(),
        time: incoming.time || incoming.timestamp || new Date().toISOString()
      };

      const currentRecords = await store.get(key, { type: "json" });
      const records = Array.isArray(currentRecords) ? currentRecords : [];

      records.unshift(record);

      await store.setJSON(key, records.slice(0, 1000));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          saved: record
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        ok: false,
        error: "Method not allowed"
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
