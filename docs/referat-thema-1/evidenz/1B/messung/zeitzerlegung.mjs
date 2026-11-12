// Zeitzerlegung der 1B-Messung (Design Abschnitte 5 und 6): teilt die Zeit je
// Zusammenfassungsauftrag in Netz, Adapter und Inferenz.
//
// Aufruf aus dem Repository-Wurzelverzeichnis:
//   node docs/referat-thema-1/evidenz/1B/messung/zeitzerlegung.mjs \
//     --app <app.tsv> --srv <srv.tsv> --log <app.log> --timings <timings.json> \
//     --app-ip <ip> --out <ergebnis.json>
//
// Eingaben: tshark-Feldausgabe beider Hosts
//   tshark -r <pcap> -T fields -E separator=/t -e frame.time_epoch -e tcp.stream
//     -e ip.src -e tcp.len -e http.request.method -e http.request.uri -e http.response.code
// sowie `docker logs` der App (Zeilen `qa_summary:completed`) und die
// timings-Objekte der Runtime je POST in POST-Reihenfolge (null ohne Modellantwort).
// Median: bei gerader Anzahl Mittel der beiden mittleren Werte.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const GET_URI = '/slots?fail_on_no_slot=1';
const POST_URI = '/v1/chat/completions';

export function parseTsharkFields(text, clientIp) {
  const frames = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const [t, stream, src, len, method, uri, code] = line.replace(/\r$/, '').split('\t');
    frames.push({
      t: Number(t),
      stream: Number(stream),
      fromClient: src === clientIp,
      payloadBytes: len ? Number(len) : 0,
      method: method || null,
      uri: uri || null,
      status: code ? Number(code) : null,
    });
  }
  return frames;
}

// Anfragebeginn = erstes Client-Segment mit Nutzdaten nach dem Ende des vorigen
// Austauschs im selben Stream (nicht der HTTP-Frame, der bei segmentierten
// Bodys erst am Ende der Anfrage steht). Ende = Frame mit Statuscode.
export function exchanges(frames) {
  const open = new Map();
  const result = [];
  for (const f of frames) {
    let s = open.get(f.stream);
    if (!s) {
      s = { tStart: null, method: null, uri: null };
      open.set(f.stream, s);
    }
    if (f.fromClient) {
      if (f.payloadBytes > 0 && s.tStart === null) s.tStart = f.t;
      if (f.method !== null) {
        if (s.tStart === null) s.tStart = f.t;
        s.method = f.method;
        s.uri = f.uri;
      }
    } else if (f.status !== null && s.tStart !== null) {
      result.push({
        stream: f.stream,
        method: s.method,
        uri: s.uri,
        status: f.status,
        tStart: s.tStart,
        tEnd: f.t,
        wireMs: (f.t - s.tStart) * 1000,
      });
      s.tStart = null;
      s.method = null;
      s.uri = null;
    }
  }
  return result;
}

// Die App loggt über console.info(message, objekt). In `docker logs` steht das
// Objekt im util.inspect-Format (Schlüssel ohne Anführungszeichen, Strings in
// einfachen Anführungszeichen, ab ~72 Zeichen mehrzeilig); JSON wird ebenfalls gelesen.
const MARKER = 'qa_summary:completed';

function field(block, key) {
  const m = new RegExp(`["']?${key}["']?\\s*:\\s*(?:'([^']*)'|"([^"]*)"|([^,}\\s]+))`).exec(block);
  if (!m) return undefined;
  if (m[1] !== undefined) return m[1];
  if (m[2] !== undefined) return m[2];
  return m[3] === 'null' ? null : m[3];
}

export function parseCompletedLog(text) {
  const result = [];
  let from = 0;
  for (;;) {
    const i = text.indexOf(MARKER, from);
    if (i < 0) break;
    const next = text.indexOf(MARKER, i + MARKER.length);
    const end = text.indexOf('}', i);
    const block = text.slice(i + MARKER.length, end < 0 ? text.length : end);
    from = i + MARKER.length;
    if (next >= 0 && end >= 0 && next < end) continue; // unvollständiger Block
    const latency = field(block, 'latencyMs');
    if (latency === undefined || latency === null || Number.isNaN(Number(latency))) continue;
    result.push({
      latencyMs: Number(latency),
      status: field(block, 'status') ?? null,
      effectiveMode: field(block, 'effectiveMode') ?? null,
      fallbackReason: field(block, 'fallbackReason') ?? null,
    });
  }
  return result;
}

const sum = (a) => a.reduce((x, y) => x + y, 0);

export function median(values) {
  const b = [...values].sort((x, y) => x - y);
  const n = b.length;
  if (n === 0) return NaN;
  return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
}

export function zerlegeAuftraege({ appExchanges, srvExchanges, completed, timings }) {
  const pick = (list, method, uriPrefix) =>
    list.filter((e) => e.method === method && e.uri !== null && e.uri.startsWith(uriPrefix));
  const appGet = pick(appExchanges, 'GET', GET_URI);
  const appPost = pick(appExchanges, 'POST', POST_URI);
  const srvGet = pick(srvExchanges, 'GET', GET_URI);
  const srvPost = pick(srvExchanges, 'POST', POST_URI);
  const counts = {
    'Log-Zeilen': completed.length,
    'POSTs (App)': appPost.length,
    'POSTs (Inferenz-Host)': srvPost.length,
    'GET /slots (App)': appGet.length,
    'GET /slots (Inferenz-Host)': srvGet.length,
    timings: timings.length,
  };
  const n = completed.length;
  if (Object.values(counts).some((c) => c !== n)) {
    const text = Object.entries(counts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    throw new Error(`Anzahl passt nicht zusammen (${text}); keine stille Paarung.`);
  }
  if (n === 0) {
    throw new Error('Keine Aufträge gefunden (Log, Mitschnitt und IP-Filter prüfen).');
  }
  timings.forEach((t, i) => {
    const status = appPost[i].status;
    if ((status === 200) !== (t !== null)) {
      throw new Error(
        `Auftrag ${i + 1}: POST-Status ${status} passt nicht zu timings ${t === null ? 'null' : 'vorhanden'}.`,
      );
    }
    if (t !== null && !(Number.isFinite(t.prompt_ms) && Number.isFinite(t.predicted_ms))) {
      throw new Error(`Auftrag ${i + 1}: timings ohne Zahl in prompt_ms oder predicted_ms.`);
    }
  });
  return completed.map((log, i) => {
    const jobMs = log.latencyMs;
    const appWire = appGet[i].wireMs + appPost[i].wireMs;
    const srvWire = srvGet[i].wireMs + srvPost[i].wireMs;
    const t = timings[i];
    const inferMs = t ? t.prompt_ms + t.predicted_ms : null;
    return {
      netzMs: appWire - srvWire,
      adapterMs: jobMs - appWire,
      inferMs,
      serverOhneInferenzMs: inferMs === null ? null : srvPost[i].wireMs - inferMs,
      jobMs,
      cacheN: t && t.cache_n !== undefined ? t.cache_n : null,
      status: log.status,
      effectiveMode: log.effectiveMode,
      fallbackReason: log.fallbackReason,
    };
  });
}

export function kennzahlen(auftraege) {
  const netz = auftraege.map((a) => a.netzMs);
  const adapter = auftraege.map((a) => a.adapterMs);
  const anteile = auftraege.filter((a) => a.inferMs !== null).map((a) => a.inferMs / a.jobMs);
  const netzMedianMs = median(netz);
  const netzMaxMs = Math.max(...netz);
  const adapterMedianMs = median(adapter);
  const inferAnteilMedian = anteile.length ? median(anteile) : null;
  return {
    n: auftraege.length,
    netz: { medianMs: netzMedianMs, maxMs: netzMaxMs },
    adapter: { medianMs: adapterMedianMs },
    inferAnteilMedian,
    hB1: netzMedianMs <= 50 && netzMaxMs <= 200,
    hB2: adapterMedianMs <= 2000,
    hB3: inferAnteilMedian !== null && inferAnteilMedian >= 0.95,
  };
}

function main(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  for (const k of ['app', 'srv', 'log', 'timings', 'app-ip', 'out']) {
    if (!args[k]) throw new Error(`Parameter --${k} fehlt`);
  }
  const read = (p) => readFileSync(p, 'utf8');
  // Der Client im Inferenz-Mitschnitt ist die App-IP (Docker-NAT: IP des app-hosts).
  const auftraege = zerlegeAuftraege({
    appExchanges: exchanges(parseTsharkFields(read(args.app), args['app-ip'])),
    srvExchanges: exchanges(parseTsharkFields(read(args.srv), args['app-ip'])),
    completed: parseCompletedLog(read(args.log)),
    timings: JSON.parse(read(args.timings)),
  });
  const ergebnis = { auftraege, kennzahlen: kennzahlen(auftraege) };
  writeFileSync(args.out, `${JSON.stringify(ergebnis, null, 2)}\n`);
  console.log(JSON.stringify(ergebnis.kennzahlen, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
