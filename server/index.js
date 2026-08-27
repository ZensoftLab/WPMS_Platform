import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());
app.post('/api/whatsapp/send', async (request, response) => {
  const { to, message } = request.body || {};
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
  if (!to || !message) return response.status(400).json({ error: 'Recipient and message are required.' });
  if (!phoneNumberId || !accessToken) return response.status(503).json({ error: 'WhatsApp credentials are not configured on the server.' });
  try {
    const metaResponse = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, { method:'POST', headers:{ Authorization:`Bearer ${accessToken}`, 'Content-Type':'application/json' }, body:JSON.stringify({ messaging_product:'whatsapp', recipient_type:'individual', to:String(to).replace(/\D/g, ''), type:'text', text:{ preview_url:false, body:message } }) });
    const data = await metaResponse.json();
    if (!metaResponse.ok) return response.status(metaResponse.status).json({ error:data.error?.message || 'Meta rejected the WhatsApp message.' });
    return response.json({ success:true, messageId:data.messages?.[0]?.id || null });
  } catch (error) { return response.status(502).json({ error:'Unable to reach WhatsApp Cloud API.', details:error.message }); }
});
app.listen(process.env.PORT || 3001, () => console.log('WhatsApp API server listening on port 3001'));
