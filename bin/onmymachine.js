#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { collect } from '../src/collect.js';
import { diffSnapshots } from '../src/diff.js';
import { renderSnapshotSummary, renderDiff, shouldColor } from '../src/render.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const HELP = `onmymachine — kill "works on my machine" in 10 seconds.

Usage:
  onmymachine                     snapshot this machine to onmymachine.json
  onmymachine snapshot [options]
  onmymachine diff <file>         compare a snapshot file with this machine

Options:
  -o, --out <file>   snapshot output path (default: onmymachine.json)
  --label <name>     label this snapshot (e.g. your name)
  --json             print machine-readable JSON to stdout
  --all              diff: show matching entries too
  -h, --help         show this help
  -v, --version      show version

Exit codes: 0 ok / no differences · 1 differences found · 2 error`;

function fail(msg) {
  process.stderr.write(`error: ${msg}\n\nRun onmymachine --help for usage.\n`);
  process.exit(2);
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      options: {
        out: { type: 'string', short: 'o', default: 'onmymachine.json' },
        label: { type: 'string' },
        json: { type: 'boolean', default: false },
        all: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    });
  } catch (e) {
    fail(e.message);
  }
  const { values, positionals } = parsed;

  if (values.help) { console.log(HELP); return; }
  if (values.version) { console.log(pkg.version); return; }

  const command = positionals[0] ?? 'snapshot';
  const color = shouldColor();

  if (command === 'snapshot') {
    const snapshot = await collect({ label: values.label });
    if (values.json) { console.log(JSON.stringify(snapshot, null, 2)); return; }
    writeFileSync(values.out, JSON.stringify(snapshot, null, 2) + '\n');
    console.log(renderSnapshotSummary(snapshot, { color }));
    console.log(`\nWrote ${values.out}`);
    console.log(`Send it to your teammate and have them run:\n  npx onmymachine diff ${values.out}`);
    return;
  }

  if (command === 'diff') {
    const file = positionals[1];
    if (!file) fail('diff needs a snapshot file: onmymachine diff <file>');
    let snapshot;
    try {
      snapshot = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      fail(`cannot read snapshot file "${file}": ${e.message}`);
    }
    if (snapshot.$schema !== 'onmymachine/v1') {
      process.stderr.write(`warning: unexpected schema "${snapshot.$schema}" — trying anyway\n`);
    }
    const current = await collect();
    const diff = diffSnapshots(snapshot, current);
    if (values.json) console.log(JSON.stringify(diff, null, 2));
    else console.log(renderDiff(diff, { color, all: values.all }));
    process.exit(diff.differences === 0 ? 0 : 1);
  }

  fail(`unknown command "${command}"`);
}

main().catch((e) => fail(e.stack ?? String(e)));
