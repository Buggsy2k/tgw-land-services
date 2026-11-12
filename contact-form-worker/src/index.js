/**
 * Contact Form Email Worker
 *
 * Accepts a POST request with JSON body:
 *   { "subject": "...", "body": "...", "from_name": "...", "from_email": "..." }
 *
 * Sends an email to tgwlandservice@gmail.com via the Cloudflare Email Service.
 */

// Only allow requests from your own site. Add subdomains if needed.
const ALLOWED_ORIGINS = [
  "https://tgwlandservices.com",
  "https://www.tgwlandservices.com",
];

// The "from" address — must be on a domain verified for Email Sending.
const FROM_ADDRESS = "contact@tgwlandservices.com";

// Where contact form submissions are delivered.
const TO_ADDRESS = "tgwlandservice@gmail.com";

// Cloudflare Turnstile verification endpoint.
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Verifies the Turnstile token. Skipped when no secret is configured.
async function verifyTurnstile(env, token, remoteip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: remoteip || "",
      }),
    });
    const outcome = await res.json().catch(() => ({ success: false }));
    return outcome.success === true;
  } catch {
    return false;
  }
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // Only accept POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers }
      );
    }

    try {
      const data = await request.json();
      const { subject, body, from_name, from_email, turnstile_token } = data;

      // Validate required fields
      if (!subject || !body) {
        return new Response(
          JSON.stringify({ success: false, error: "Subject and body are required" }),
          { status: 400, headers }
        );
      }

      // Reject submissions that fail the bot check
      const passed = await verifyTurnstile(
        env,
        turnstile_token,
        request.headers.get("CF-Connecting-IP")
      );
      if (!passed) {
        return new Response(
          JSON.stringify({ success: false, error: "Verification failed" }),
          { status: 403, headers }
        );
      }

      // Build email content — include the visitor's name/email so you can reply
      const senderLine = from_name || from_email
        ? `From: ${from_name || ""}${from_email ? ` <${from_email}>` : ""}`
        : "From: (not provided)";

      const textContent = `New contact form submission\n\n${senderLine}\n\n${body}`;
      const htmlContent = `
        <h2>New Contact Form Submission</h2>
        <p><strong>${senderLine}</strong></p>
        <hr>
        <p>${body.replace(/\n/g, "<br>")}</p>
      `;

      // Send the email via the Email Service binding
      const response = await env.EMAIL.send({
        from: FROM_ADDRESS,
        to: TO_ADDRESS,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });

      return new Response(
        JSON.stringify({ success: true, messageId: response.messageId }),
        { status: 200, headers }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 500, headers }
      );
    }
  },
};
