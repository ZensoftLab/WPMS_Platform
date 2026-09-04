import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

const app = express();
app.use(express.json({ limit: '10mb' }));
const openApiSpec = {
  openapi: '3.0.3', info: { title: 'BINTLBE WhatsApp API', version: '1.0.0', description: 'Brisk Internet Lifestyle Business Engine API for WhatsApp Business messaging.' }, servers: [{ url: 'http://localhost:3001' }], tags: [{ name: 'System' }, { name: 'WhatsApp' }], paths: {
    '/api/health': { get: { tags:['System'], summary:'Check API and WhatsApp configuration status', responses:{ '200': { description:'Service status', content:{'application/json':{schema:{type:'object',properties:{service:{type:'string'},whatsappConfigured:{type:'boolean'}}}}}} } } },
    '/api/whatsapp/send': { post: { tags:['WhatsApp'], summary:'Send a WhatsApp text, approved template, or image message', requestBody:{required:true, content:{'application/json':{schema:{$ref:'#/components/schemas/SendMessageRequest'}, examples:{template:{summary:'Approved template message',value:{to:'8801811635119',message:'John Doe',templateParameters:['John Doe','123456','Sep 4, 2026']}},text:{summary:'Text message',value:{to:'8801811635119',message:'Hello from Brisk'}}}}}}, responses:{'200':{description:'Message accepted by Meta',content:{'application/json':{schema:{$ref:'#/components/schemas/SendMessageResponse'}}}},'400':{description:'Invalid request or recipient'},'503':{description:'Server credentials are not configured'},'4XX':{description:'Meta API rejected the request'}} } }
  }, components:{schemas:{SendMessageRequest:{type:'object',required:['to','message'],properties:{to:{type:'string',example:'8801811635119',description:'Recipient number in international format. Local 018 numbers are normalized to 88018.'},message:{type:'string',example:'Hello from Brisk'},templateParameters:{type:'array',items:{type:'string'},description:'Body parameters in the same order as the approved Meta template.'},imageData:{type:'string',format:'byte',description:'Optional data URL for JPG, PNG, or WebP image attachment.'}}},SendMessageResponse:{type:'object',properties:{success:{type:'boolean'},messageId:{type:'string',nullable:true}}}}}
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle:'BINTLBE API Docs' }));
app.get('/api-docs.json', (_request, response) => response.json(openApiSpec));
const normalizeWhatsAppNumber = value => { const digits = String(value || '').replace(/\D/g, ''); if (digits.startsWith('880')) return digits; if (digits.startsWith('0')) return `880${digits.slice(1)}`; return digits; };
app.get('/api/health', (_request, response) => response.json({ service: 'BINTLBE', whatsappConfigured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN) }));

app.post('/api/whatsapp/send', async (request, response) => {
  const { to, message, imageData, templateParameters = [], useTemplate } = request.body || {};
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || 'v25.0';
  const shouldUseTemplate = useTemplate === undefined
    ? process.env.WHATSAPP_USE_TEMPLATE === 'true' && !imageData
    : Boolean(useTemplate);
  if (!to || !message) return response.status(400).json({ error: 'Recipient and message are required.' });
  if (!phoneNumberId || !accessToken) return response.status(503).json({ error: 'WhatsApp credentials are not configured on the server.' });
  try {
    let mediaId = null;
    if (imageData) {
      const match = String(imageData).match(/^data:(.*?);base64,(.*)$/);
      if (!match) return response.status(400).json({ error:'Invalid image attachment.' });
      const upload = new FormData();
      upload.append('messaging_product', 'whatsapp');
      upload.append('file', new Blob([Buffer.from(match[2], 'base64')], { type:match[1] }), 'attachment');
      const mediaResponse = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/media`, { method:'POST', headers:{ Authorization:`Bearer ${accessToken}` }, body:upload });
      const media = await mediaResponse.json();
      if (!mediaResponse.ok) return response.status(mediaResponse.status).json({ error:media.error?.message || 'Image upload was rejected by Meta.' });
      mediaId = media.id;
    }
    const recipient = normalizeWhatsAppNumber(to);
    if (!recipient || recipient.length < 10) return response.status(400).json({ error: 'Use a valid WhatsApp number, for example 8801811635119.' });
    const payload = mediaId
      ? { messaging_product:'whatsapp', recipient_type:'individual', to:recipient, type:'image', image:{ id:mediaId, caption:message } }
      : shouldUseTemplate
        ? { messaging_product:'whatsapp', to:recipient, type:'template', template:{ name:process.env.WHATSAPP_TEMPLATE_NAME, language:{ code:process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US' }, components:[{ type:'body', parameters:templateParameters.map(text => ({ type:'text', text:String(text) })) }] } }
        : { messaging_product:'whatsapp', recipient_type:'individual', to:recipient, type:'text', text:{ preview_url:false, body:message } };
    const metaResponse = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, { method:'POST', headers:{ Authorization:`Bearer ${accessToken}`, 'Content-Type':'application/json' }, body:JSON.stringify(payload) });
    const data = await metaResponse.json();
    if (!metaResponse.ok) return response.status(metaResponse.status).json({ error:data.error?.message || 'Meta rejected the WhatsApp message.', code:data.error?.code || null });
    return response.json({ success:true, messageId:data.messages?.[0]?.id || null });
  } catch (error) { return response.status(502).json({ error:'Unable to reach WhatsApp Cloud API.', details:error.message }); }
});

app.listen(process.env.PORT || 3001, () => console.log('BINTLBE WhatsApp API listening on port 3001'));
