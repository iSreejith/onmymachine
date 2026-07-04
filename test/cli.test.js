import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const BIN = fileURLToPath(new URL('../bin/onmymachine.js', import.meta.url));

const exec = (args, opts = {}) =>
  run(process.execPath, [BIN, ...args], { ...opts }).catch(e => e);

test('snapshot --json prints a valid v1 snapshot to stdout', async () => {
  const r = await exec(['snapshot', '--json']);
  const snap = JSON.parse(r.stdout);
  assert.equal(snap.$schema, 'onmymachine/v1');
  assert.ok(snap.tools.node); // node must be detected — we are running on it
});

test('snapshot writes file; diff against self exits 0', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'omm-'));
  const out = join(dir, 'snap.json');
  await exec(['snapshot', '-o', out]);
  const snap = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(snap.$schema, 'onmymachine/v1');
  const d = await exec(['diff', out]);
  assert.equal(d.code ?? 0, 0, d.stdout + d.stderr);
  assert.match(d.stdout, /No differences/i);
});

test('diff detects a difference and exits 1', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'omm-'));
  const out = join(dir, 'snap.json');
  await exec(['snapshot', '-o', out]);
  const snap = JSON.parse(readFileSync(out, 'utf8'));
  snap.tools.node = '0.0.1'; // sabotage
  writeFileSync(out, JSON.stringify(snap));
  const d = await exec(['diff', out]);
  assert.equal(d.code, 1);
  assert.match(d.stdout, /node/);
  assert.match(d.stdout, /0\.0\.1/);
});

test('bad snapshot file exits 2; --help exits 0; unknown command exits 2', async () => {
  const bad = await exec(['diff', 'does-not-exist.json']);
  assert.equal(bad.code, 2);
  const help = await exec(['--help']);
  assert.equal(help.code ?? 0, 0);
  assert.match(help.stdout, /onmymachine/);
  const unk = await exec(['frobnicate']);
  assert.equal(unk.code, 2);
});
