import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import test from 'node:test';
import { leseVersuchsreihe, werteVersuchsreiheAus } from './evaluate-resource-isolation.mjs';

const exec = promisify(execFile);
const quelle = resolve('docs/referat-thema-1/evidenz/1A/reihe-2026-11-12');

test('wertet ausschließlich die 25 vollständigen gepaarten Läufe aus und bewahrt Grenzverletzungen', async () => {
  const daten = await leseVersuchsreihe(quelle);
  const auswertung = werteVersuchsreiheAus(daten);
  assert.equal(auswertung.runs.length, 25);
  assert.equal(auswertung.comparisons.length, 80);
  assert.equal(auswertung.hypotheses.H1.passed, false);
  assert.equal(auswertung.hypotheses.H2.passed, false);
  assert.equal(auswertung.hypotheses.H1.failedComparisons, 4);
  assert.equal(auswertung.hypotheses.H2.failedComparisons, 6);
  assert.equal(
    auswertung.runs.every((lauf) => lauf.live.vote.voteTargetPassed),
    true,
  );
  assert.equal(
    auswertung.runs.every((lauf) => lauf.resources.every((c) => c.oomPassed)),
    true,
  );
  const blockEins = auswertung.comparisons.find(
    (x) => x.variant === 'V2' && x.block === 1 && x.action === 'join',
  );
  assert.equal(blockEins.relativePassed, false);
  assert.equal(blockEins.absolutePassed, true);
  assert.ok(blockEins.candidate.p95Ms > blockEins.baseline.p95Ms * 2);
});

test('verwirft unvollständige Reihen vor dem Lesen einzelner Nachweise', async (t) => {
  const ordner = await mkdtemp(join(tmpdir(), 'a1-auswertung-fehlt-'));
  t.after(() => rm(ordner, { recursive: true, force: true }));
  await assert.rejects(() => leseVersuchsreihe(ordner));
  await writeFile(join(ordner, 'abschluss.json'), JSON.stringify({ complete: false }));
  await assert.rejects(() => leseVersuchsreihe(ordner));
});

test('prüft Ressourcen-Prüfsummen und erkennt einen nachträglich veränderten Inhalt', async (t) => {
  const ordner = await mkdtemp(join(tmpdir(), 'a1-auswertung-pruefsumme-'));
  t.after(() => rm(ordner, { recursive: true, force: true }));
  await cp(quelle, ordner, { recursive: true });
  await writeFile(join(ordner, 'V1/block-01/ressourcen.json.gz'), 'kein unverändertes Artefakt');
  await assert.rejects(() => leseVersuchsreihe(ordner), /Prüfsumme/);
});

test('erkennt veränderte Reihenfolge und abweichende Fixture- oder Werkzeugidentität', async (t) => {
  const ordner = await mkdtemp(join(tmpdir(), 'a1-auswertung-identitaet-'));
  t.after(() => rm(ordner, { recursive: true, force: true }));
  await cp(quelle, ordner, { recursive: true });
  const pfad = join(ordner, 'V1/block-01/lauf.json');
  const original = JSON.parse(await readFile(pfad, 'utf8'));
  for (const aenderung of [
    { fixtureSha256: 'a'.repeat(64) },
    { toolsSha256After: 'b'.repeat(64) },
    { position: 2 },
  ]) {
    await writeFile(
      pfad,
      JSON.stringify({ ...original, manifest: { ...original.manifest, ...aenderung } }),
    );
    await assert.rejects(() => leseVersuchsreihe(ordner));
  }
});

test('verwirft einen scheinbar vollständigen Nachweis mit String statt echtem Wahrheitswert', async (t) => {
  const ordner = await mkdtemp(join(tmpdir(), 'a1-auswertung-wahrheitswert-'));
  t.after(() => rm(ordner, { recursive: true, force: true }));
  await cp(quelle, ordner, { recursive: true });
  const pfad = join(ordner, 'abschluss.json');
  const abschluss = JSON.parse(await readFile(pfad, 'utf8'));
  await writeFile(pfad, JSON.stringify({ ...abschluss, complete: 'false' }));
  await assert.rejects(() => leseVersuchsreihe(ordner), /Abschluss/);
});

test('CLI schreibt JSON, CSV und Markdown und überschreibt keine bestehenden Auswertungen', async (t) => {
  const ordner = await mkdtemp(join(tmpdir(), 'a1-auswertung-cli-'));
  t.after(() => rm(ordner, { recursive: true, force: true }));
  const ausgabe = join(ordner, 'ergebnis');
  const args = [
    'scripts/load/evaluate-resource-isolation.mjs',
    '--run',
    '--evidence-root',
    quelle,
    '--output-dir',
    ausgabe,
  ];
  const { stdout } = await exec(process.execPath, args, { timeout: 30000 });
  assert.match(stdout, /25/);
  const json = JSON.parse(await readFile(join(ausgabe, 'auswertung.json'), 'utf8'));
  assert.equal(json.hypotheses.H1.passed, false);
  assert.match(await readFile(join(ausgabe, 'auswertung.md'), 'utf8'), /nicht bestätigt/);
  assert.equal(
    (await readFile(join(ausgabe, 'live-vergleiche.csv'), 'utf8')).trim().split('\n').length,
    81,
  );
  await assert.rejects(() => exec(process.execPath, args, { timeout: 30000 }));
});
