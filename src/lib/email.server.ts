const TEAM_EMAIL = "hello@bredaguardians.com";
const FROM_EMAIL = "Breda Guardians <hello@bredaguardians.com>";
const DISCORD_INVITE = "https://discord.gg/eFtnfWrdHJ";

type SendResult = { sent: boolean; reason?: string };

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.log("[email] not configured, skipping send:", { to, subject });
    return { sent: false, reason: "email_not_configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] send failed:", res.status, body);
    return { sent: false, reason: `send_failed_${res.status}` };
  }
  return { sent: true };
}

const shell = (body: string) => `
  <div style="font-family:Inter,Arial,sans-serif;background:#0b0f14;color:#e8edf2;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#121821;border-radius:16px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:22px;color:#e3b04b">BREDA GUARDIANS</h1>
      ${body}
      <p style="margin-top:32px;font-size:12px;color:#7b8794">The Hive &middot; Breda University of Applied Sciences</p>
    </div>
  </div>`;

const HERO_IMAGE =
  "https://breda-guardians-hub.lovable.app/__l5e/assets-v1/155099a2-079b-4f17-b557-b0cecd19232d/hero-character.png";

export function sendMembershipWelcome(to: string, tier: string) {
  return send(
    to,
    `Welcome to the Hive — your ${tier} membership is active`,
    `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#0a0a0a;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#111111;border:1px solid #262626;border-radius:16px;overflow:hidden">
        <div style="background:#F2C744;padding:20px 28px">
          <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:1px;color:#0a0a0a">BREDA GUARDIANS</p>
        </div>
        <div style="background:#0a0a0a;text-align:center;padding:0">
          <img src="${HERO_IMAGE}" alt="Breda Guardians" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0" />
        </div>
        <div style="padding:28px">
          <h1 style="margin:0 0 8px;font-size:28px;line-height:1.1;color:#F2C744;text-transform:uppercase">Welcome to the Hive</h1>
          <p style="margin:0 0 18px;font-size:16px;color:#f5f5f5">
            Your <strong style="color:#F2C744">${tier}</strong> membership is active. Thanks for backing Breda Guardians — every euro goes straight back into gear, chairs, events and the community itself.
          </p>
          <p style="margin:0 0 18px;font-size:16px;color:#f5f5f5">
            <strong style="color:#F2C744">Next step:</strong> join our Discord. That's where play nights, teams and everything else happens — and your member role will be added there shortly after you join.
          </p>
          <p style="margin:0 0 24px;text-align:center">
            <a href="${DISCORD_INVITE}" style="display:inline-block;background:#F2C744;color:#0a0a0a;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:800;font-size:17px;letter-spacing:0.5px">JOIN OUR DISCORD</a>
          </p>
          <p style="margin:0;font-size:15px;color:#bdbdbd">See you in the Hive.</p>
        </div>
        <div style="background:#0a0a0a;padding:18px 28px;border-top:1px solid #262626">
          <p style="margin:0;font-size:12px;color:#8a8a8a">The Hive &middot; Breda University of Applied Sciences</p>
        </div>
      </div>
    </div>`,
  );
}

export function sendPaymentIssue(to: string, tier: string) {
  return send(
    to,
    "Your Breda Guardians membership payment failed",
    shell(`
      <p>We couldn't take the payment for your <strong>${tier}</strong> membership, so member access has been paused for now.</p>
      <p>Update your card details and you'll be back in straight away.</p>
      <p>Need a hand? Just reply to this email.</p>
    `),
  );
}

export function sendMembershipCancelled(to: string, tier: string) {
  return send(
    to,
    "Your Breda Guardians membership has been cancelled",
    shell(`
      <p>Your <strong>${tier}</strong> membership has been cancelled and member access has ended.</p>
      <p>You're always welcome back — and you can still hang out with us on Discord.</p>
      <p><a href="${DISCORD_INVITE}" style="color:#e3b04b">${DISCORD_INVITE}</a></p>
    `),
  );
}

export function sendTeamNotification(eventType: string, email: string, tier: string) {
  const label: Record<string, string> = {
    purchase: "New membership purchase",
    cancelled: "Membership cancelled",
    payment_failed: "Membership payment failed",
  };
  return send(
    TEAM_EMAIL,
    `[Memberships] ${label[eventType] ?? eventType} — ${tier}`,
    shell(`
      <p><strong>${label[eventType] ?? eventType}</strong></p>
      <p>Member: ${email}<br/>Tier: ${tier}</p>
      <p>Remember to assign or remove the Discord role for this member.</p>
    `),
  );
}
