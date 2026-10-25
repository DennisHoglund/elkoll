// Elkoll – tolkar en dikterad/skriven uppdragsbeskrivning till fält med Gemini.
// Nyckeln ligger som hemlighet i Supabase (GEMINI_API_KEY) och når aldrig telefonen.
// Bara inloggade kan anropa funktionen (Supabase kontrollerar JWT).
//
// Anrop:  POST { text: string, idag: 'YYYY-MM-DD' }
// Svar:   { datum, tid, adress, kund, telefon, portkod, uppgift, material[], saknas[] }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const MODELL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash';
const RESERV = Deno.env.get('GEMINI_RESERV') || 'gemini-3.5-flash-lite';   // används om huvudmodellen inte svarar

const SCHEMA = {
  type: 'object',
  properties: {
    datum: { type: 'string', description: 'YYYY-MM-DD, tom sträng om okänt' },
    tid: { type: 'string', description: 'HH:MM i 24-timmarsformat, tom sträng om okänt' },
    adress: { type: 'string', description: 'Gata, nummer och ort' },
    kund: { type: 'string' },
    telefon: { type: 'string', description: 'Svenskt format, t.ex. 070-123 45 67' },
    portkod: { type: 'string' },
    uppgift: { type: 'string', description: 'Kort rubrik på jobbet, t.ex. Byta elcentral' },
    material: { type: 'array', items: { type: 'string' }, description: 'Material att ta med, kort och tydligt' },
    saknas: { type: 'array', items: { type: 'string', enum: ['datum', 'tid', 'adress', 'kund', 'telefon', 'portkod', 'uppgift'] } }
  },
  required: ['datum', 'tid', 'adress', 'kund', 'telefon', 'portkod', 'uppgift', 'material', 'saknas']
};

function svar(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return svar(405, { error: 'Endast POST' });

  const nyckel = Deno.env.get('GEMINI_API_KEY');
  if (!nyckel) return svar(500, { error: 'GEMINI_API_KEY saknas i Supabase' });

  let text = '';
  let idag = '';
  try {
    const body = await req.json();
    text = String(body.text || '').slice(0, 4000);
    idag = /^\d{4}-\d{2}-\d{2}$/.test(body.idag) ? body.idag : new Date().toISOString().slice(0, 10);
  } catch {
    return svar(400, { error: 'Ogiltig förfrågan' });
  }
  if (text.trim().length < 3) return svar(400, { error: 'Texten är tom' });

  const veckodag = new Date(idag + 'T12:00:00Z').toLocaleDateString('sv-SE', { weekday: 'long', timeZone: 'UTC' });
  const instruktion =
    'Du hjälper hantverkare (elektriker, snickare) att göra om en dikterad uppdragsbeskrivning till fält. ' +
    'Texten är ofta dikterad på svenska och kan ha felhörda ord – tolka rimligt. ' +
    `Idag är ${veckodag} ${idag}. Räkna om "imorgon", "på fredag", "nästa vecka" till datum. ` +
    'Tider som "halv åtta" blir 07:30 om inget annat sägs. ' +
    'Hitta inte på något: lämna fältet tomt och lägg fältnamnet i saknas om det inte står i texten. ' +
    'portkod hör bara hemma i saknas om det låter som en lägenhet/port. ' +
    'uppgift ska vara en kort rubrik (max ca 6 ord) med stor begynnelsebokstav.';

  // Lite tänkande räcker för att fylla i fält och gör svaret snabbt. Varje anrop får max 15 s.
  let medTankande = true;
  const anropa = async (modell: string): Promise<Response> => {
    const generationConfig: Record<string, unknown> = { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA };
    if (medTankande) generationConfig.thinkingConfig = { thinkingLevel: 'low' };
    try {
      return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modell}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': nyckel },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: instruktion }] }, contents: [{ role: 'user', parts: [{ text }] }], generationConfig }),
        signal: AbortSignal.timeout(15000)
      });
    } catch {
      return new Response('Tidsgräns', { status: 504 });
    }
  };
  const start = Date.now();

  // Gemini svarar ibland 503 (överbelastad) eller 500/429. Försök igen med kort paus,
  // och byt till reservmodellen om huvudmodellen inte svarar.
  const modeller = [...new Set([MODELL, RESERV])];
  const pauser = [0, 700];
  let res: Response | null = null;
  let senast = 0;
  ytter:
  for (const modell of modeller) {
    for (const paus of pauser) {
      if (Date.now() - start > 30000) break ytter;  // ge besked i tid i stället för att hänga
      if (paus) await new Promise((r) => setTimeout(r, paus));
      res = await anropa(modell);
      if (res.ok) break ytter;
      senast = res.status;
      const fel = (await res.text()).slice(0, 300);
      console.error('Gemini', modell, res.status, fel);
      // Modellen kan sakna stöd för thinkingLevel – försök direkt igen utan
      if (res.status === 400 && medTankande && /thinking/i.test(fel)) { medTankande = false; res = await anropa(modell); if (res.ok) break ytter; senast = res.status; }
      if (res.status === 404 || res.status === 400 || res.status === 403) break;  // försök inte igen med samma modell
    }
  }

  if (!res || !res.ok) {
    const fel = senast === 429 ? 'För många tolkningar just nu, vänta en minut.'
      : senast === 503 || senast === 500 || senast === 504 ? 'Googles tolkning är överbelastad just nu. Försök igen om en stund eller fyll i själv.'
      : 'Tolkningen misslyckades (' + senast + ')';
    return svar(502, { error: fel });
  }

  try {
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '{}';
    const f = JSON.parse(raw);
    return svar(200, {
      datum: /^\d{4}-\d{2}-\d{2}$/.test(f.datum) ? f.datum : '',
      tid: /^\d{2}:\d{2}$/.test(f.tid) ? f.tid : '',
      adress: String(f.adress || ''),
      kund: String(f.kund || ''),
      telefon: String(f.telefon || ''),
      portkod: String(f.portkod || ''),
      uppgift: String(f.uppgift || ''),
      material: Array.isArray(f.material) ? f.material.map(String).filter(Boolean).slice(0, 20) : [],
      saknas: Array.isArray(f.saknas) ? f.saknas.map(String) : []
    });
  } catch (e) {
    console.error('Tolkning', e);
    return svar(502, { error: 'Kunde inte läsa svaret från tolkningen' });
  }
});
