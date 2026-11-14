#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parse, stringify } from 'yaml';
import { leseVersuchsreihe } from './evaluate-resource-isolation.mjs';
import { erstelleLaborCompose, istDirekterAufruf } from './lib/resource-isolation-experiment.mjs';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../../', import.meta.url));
const sha = (daten) => createHash('sha256').update(daten).digest('hex');
import { bereinigeCompose, pruefeManifestAbgleich } from './lib/resource-isolation-compose.mjs';
export { bereinigeCompose, pruefeManifestAbgleich };

async function main(args) {
  if (args.length !== 2 || args[0] !== '--output-dir')
    throw new Error('Genau --output-dir <neuer Ordner> verwenden.');
  const evidence = join(root, 'docs/referat-thema-1/evidenz/1A/reihe-2026-11-12');
  const daten = await leseVersuchsreihe(evidence);
  const { stdout: baseline } = await exec(
    'git',
    ['show', `${daten.identity.baselineCommit}:docker-compose.prod.yml`],
    { cwd: root },
  );
  const helper = await readFile(
    new URL('./lib/resource-isolation-experiment.mjs', import.meta.url),
  );
  const { stdout: originalHelper } = await exec(
    'git',
    ['show', 'HEAD:scripts/load/lib/resource-isolation-experiment.mjs'],
    { cwd: root },
  );
  if (sha(helper) !== sha(originalHelper))
    throw new Error('Eingefrorener Aufbauhelfer wurde verändert.');
  const { stdout: composeVersion } = await exec('docker', ['compose', 'version', '--short']);
  const privat = await mkdtemp(join(tmpdir(), 'a1-compose-rekonstruktion-'));
  const { format, resolveConfig } = await import('prettier');
  const formatierung = await resolveConfig(join(root, 'package.json'));
  const exporte = [];
  const abgleiche = [];
  try {
    const secretsFile = join(privat, 'synthetisch.env');
    await writeFile(
      secretsFile,
      'POSTGRES_USER=arsnova_user\nPOSTGRES_DB=arsnova_v3\nPOSTGRES_PASSWORD=RECONSTRUCTION_PLACEHOLDER\nNODE_ENV=production\nRATE_LIMIT_SESSION_CREATE_PER_HOUR=480\nRATE_LIMIT_SESSION_CREATE_GLOBAL_PER_HOUR=2400\n',
      { mode: 0o600 },
    );
    for (const variant of ['V0', 'V1', 'V2', 'V3', 'V4']) {
      const config = erstelleLaborCompose(parse(baseline), {
        variant,
        images: { app: daten.identity.applicationImage, spacy: daten.identity.spacyImage },
        secretsFile,
        proxyDirectory: join(privat, 'proxy'),
        socketDirectory: join(privat, 'spacy'),
      });
      for (const name of ['postgres', 'redis']) config.services[name].image = daten.images[name];
      const file = join(privat, 'compose.yml');
      await writeFile(file, stringify(config), { mode: 0o600 });
      const { stdout } = await exec(
        'docker',
        [
          'compose',
          '--env-file',
          secretsFile,
          '-f',
          file,
          '-p',
          'arsnova-1a',
          '--profile',
          'nlp',
          'config',
          '--format',
          'json',
        ],
        { cwd: root, maxBuffer: 1024 * 1024 },
      );
      const aufgeloest = JSON.parse(stdout);
      for (const r of daten.records.filter((r) => r.manifest.variant === variant)) {
        if (r.manifest.composeSha256 !== sha(baseline))
          throw new Error('Baseline-Compose-Hash weicht ab.');
        pruefeManifestAbgleich(aufgeloest, r.manifest);
        abgleiche.push({ file: `${variant}/${r.manifest.run}/lauf.json`, manifestCompared: true });
      }
      const json = await format(
        JSON.stringify({
          schemaVersion: 1,
          kind: 'reconstruction',
          contemporaneous: false,
          variant,
          baselineCommit: daten.identity.baselineCommit,
          baselineComposeSha256: sha(baseline),
          compose: bereinigeCompose(aufgeloest),
        }),
        { ...formatierung, parser: 'json' },
      );
      exporte.push({ file: `${variant}.json`, json, sha256: sha(json) });
    }
    const index = {
      schemaVersion: 1,
      kind: 'reconstruction',
      contemporaneous: false,
      reconstructedAt: new Date().toISOString(),
      composeVersion: composeVersion.trim(),
      baselineCommit: daten.identity.baselineCommit,
      baselineComposeSha256: sha(baseline),
      builderSha256: sha(helper),
      reconstructionToolSha256: sha(await readFile(new URL(import.meta.url))),
      limitation:
        'Nachträglich aus versioniertem Aufbau und Image-IDs aufgelöst; keine zum Messzeitpunkt gespeicherte Compose-Ausgabe. Nur aufgezeichnete Manifestfelder werden rückwirkend abgeglichen. Kein neuer Lastversuch und keine rückwirkende Bestätigung nicht aufgezeichneter Einstellungen.',
      sanitization:
        'Positivliste; Secrets, URLs, IPs, Hostpfade, Containerkennungen und nicht freigegebene Umgebungsfelder entfernt. Bind-Mount-Quellen sind symbolische Platzhalter. Alle fünf Dienste sind deklariert; spaCy wurde bei V0/V1 nicht gestartet.',
      artifacts: exporte.map(({ file, sha256 }) => ({ file, sha256 })),
      runs: abgleiche,
    };
    await mkdir(args[1]);
    for (const { file, json } of exporte)
      await writeFile(join(args[1], file), json, { flag: 'wx' });
    await writeFile(
      join(args[1], 'index.json'),
      await format(JSON.stringify(index), { ...formatierung, parser: 'json' }),
      { flag: 'wx' },
    );
    process.stdout.write(
      'Fünf bereinigte Compose-Varianten rekonstruiert; gegen 25 Laufmanifeste abgeglichen. Keine damalige Aufnahme behauptet.\n',
    );
  } finally {
    await rm(privat, { recursive: true, force: true });
  }
}

if (await istDirekterAufruf(new URL(import.meta.url))) {
  try {
    await main(process.argv.slice(2));
  } catch {
    process.stderr.write(
      'Compose-Rekonstruktion fehlgeschlagen: Baseline, Manifeste, Docker Compose und neuen Ausgabeordner prüfen.\n',
    );
    process.exitCode = 1;
  }
}
