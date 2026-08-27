export async function sendWhatsAppMessage({ to, message }) {
  const response = await fetch('/api/whatsapp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, message }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'WhatsApp message could not be sent');
  return result;
}
