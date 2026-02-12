const jsonResponse = (statusCode, data) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(data),
});

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }
  return value;
};

const sendToSupabase = async (payload) => {
  const sbUrl = requireEnv("SUPABASE_URL");
  const sbKey = requireEnv("SUPABASE_ANON_KEY");

  const response = await fetch(`${sbUrl}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
    },
    body: JSON.stringify({
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      loss_amount: payload.lossAmount,
      loss_where: payload.lossWhere,
      notes: payload.notes,
      status: "Yeni",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error: ${response.status} ${text}`);
  }
};

const sendToCrm = async (payload) => {
  const url = process.env.CRM_API_URL;
  const token = process.env.CRM_API_KEY;

  if (!url || !token) {
    console.log("CRM not configured, skipping");
    return;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CRM error: ${response.status} ${text}`);
  }
};

const sendToTelegram = async (payload) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("Telegram not configured, skipping");
    return;
  }

  const message = [
    "📝 Nuova richiesta",
    `Nome: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Telefono: ${payload.phone}`,
    `Importo perso: €${payload.lossAmount}`,
    `Luogo perdita: ${payload.lossWhere}`,
    `Note: ${payload.notes || "-"}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram error: ${response.status} ${text}`);
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const data = JSON.parse(event.body || "{}");

    if (!data.fullName || !data.email || !data.phone || !data.lossAmount || !data.lossWhere) {
      return jsonResponse(400, { error: "Missing required fields" });
    }

    await sendToSupabase(data);
    await sendToTelegram(data);
    await sendToCrm(data);

    return jsonResponse(200, { ok: true });
  } catch (error) {
    return jsonResponse(500, { error: error.message || "Server error" });
  }
};
