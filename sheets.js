/**
 * Netlify Function: /api/sheets
 * Google Apps Script API'ga xavfsiz vositachi (proxy).
 * Apps Script manzili va API_TOKEN faqat Netlify muhit o‘zgaruvchilarida saqlanadi,
 * brauzerga hech qachon chiqmaydi.
 *
 * Muhit o‘zgaruvchilari (Netlify → Site configuration → Environment variables):
 *   APPS_SCRIPT_URL  — Apps Script Web App manzili (.../exec)
 *   API_TOKEN        — Apps Script'dagi API_TOKEN bilan bir xil satr
 *   APP_PASSWORD     — (ixtiyoriy) saytga kirish paroli
 */

const json = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  const { APPS_SCRIPT_URL, API_TOKEN, APP_PASSWORD } = process.env;

  if (!APPS_SCRIPT_URL || !API_TOKEN) {
    return json(500, { ok: false, error: 'Server sozlanmagan: APPS_SCRIPT_URL yoki API_TOKEN kiritilmagan.' });
  }

  if (APP_PASSWORD) {
    const given = event.headers['x-app-key'] || event.headers['X-App-Key'] || '';
    if (given !== APP_PASSWORD) {
      return json(401, { ok: false, error: 'Parol noto‘g‘ri yoki kiritilmagan.', auth: true });
    }
  }

  const url = `${APPS_SCRIPT_URL}?token=${encodeURIComponent(API_TOKEN)}&t=${Date.now()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return json(502, { ok: false, error: 'Google Apps Script JSON qaytarmadi. Web App "Anyone" uchun ochilganini tekshiring.' });
    }
    if (!data.ok) return json(502, { ok: false, error: data.error || 'Google Sheets xatosi' });
    return json(200, data);
  } catch (err) {
    const msg = err.name === 'AbortError'
      ? 'Google Sheets javob bermadi (vaqt tugadi). Birozdan so‘ng qayta urinib ko‘ring.'
      : 'Google Sheets bilan bog‘lanib bo‘lmadi: ' + err.message;
    return json(504, { ok: false, error: msg });
  } finally {
    clearTimeout(timer);
  }
};
