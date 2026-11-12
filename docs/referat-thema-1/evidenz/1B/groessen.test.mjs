// Prüft die Bash-Umsetzung der Größenregel (groessen.sh) gegen groessen-faelle.json.
// Dieselben Fälle prüft groessen.Tests.ps1 für die PowerShell-Umsetzung.
// Aufruf: node --test docs/referat-thema-1/evidenz/1B/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { faelle } = JSON.parse(readFileSync(join(here, 'groessen-faelle.json'), 'utf8'));

function empfehlung({ kerne, threads, ramGib, kernJeCpu }) {
  const out = execFileSync(
    'bash',
    [
      '-c',
      'source "$0"; groessen_empfehlung "$@"',
      join(here, 'groessen.sh'),
      String(kerne),
      String(threads),
      String(ramGib),
      kernJeCpu.join(','),
    ],
    { encoding: 'utf8' },
  );
  return JSON.parse(out);
}

for (const fall of faelle) {
  test(`Bash: ${fall.name}`, () => {
    const ist = empfehlung(fall.eingabe);
    if (fall.erwartet.abbruch) {
      assert.equal(ist.abbruch, fall.erwartet.abbruch);
      return;
    }
    assert.deepEqual(ist, fall.erwartet);
  });
}
