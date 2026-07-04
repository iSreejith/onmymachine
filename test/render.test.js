import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnapshotSummary, renderDiff, shouldColor } from '../src/render.js';

const snap = {
  meta: { version: '0.1.0', createdAt: '2026-07-04T00:00:00Z', label: 'sree-laptop' },
  system: { platform: 'linux', release: '6.1', arch: 'x64', shell: 'bash' },
  tools: { node: '20.1.0', git: '2.45.1', docker: null },
  env: { names: ['PATH'], values: {}, path: ['/usr/bin'] },
};

test('snapshot summary lists installed tools and counts', () => {
  const out = renderSnapshotSummary(snap, { color: false });
  assert.match(out, /sree-laptop/);
  assert.match(out, /linux/);
  assert.match(out, /node\s+20\.1\.0/);
  assert.match(out, /git\s+2\.45\.1/);
  assert.doesNotMatch(out, /docker\s+null/);
  assert.match(out, /1 of 3 tools not detected/);
  assert.doesNotMatch(out, /\x1b\[/); // no ANSI when color: false
});

test('diff render shows mismatches and summary, hides matches by default', () => {
  const diff = {
    tools: [
      { name: 'node', snapshot: '20.1.0', current: '22.3.0', status: 'mismatch' },
      { name: 'git', snapshot: '2.45.1', current: '2.45.1', status: 'match' },
      { name: 'docker', snapshot: '27.0', current: null, status: 'only-in-snapshot' },
    ],
    system: [{ key: 'platform', snapshot: 'linux', current: 'linux', status: 'match' }],
    envValues: [{ name: 'JAVA_HOME', snapshot: '/jdk', current: null, status: 'only-in-snapshot' }],
    envNames: { onlyInSnapshot: [], onlyOnThisMachine: ['GOPATH'] },
    path: { onlyInSnapshot: [], onlyOnThisMachine: [] },
    differences: 4,
  };
  const out = renderDiff(diff, { color: false });
  assert.match(out, /node/);
  assert.match(out, /20\.1\.0/);
  assert.match(out, /22\.3\.0/);
  assert.match(out, /docker/);
  assert.match(out, /JAVA_HOME/);
  assert.match(out, /GOPATH/);
  assert.match(out, /4 differences found/);
  assert.doesNotMatch(out, /git/); // matches hidden by default
  const withAll = renderDiff(diff, { color: false, all: true });
  assert.match(withAll, /git/);
});

test('zero differences prints a friendly all-clear', () => {
  const diff = { tools: [], system: [], envValues: [], envNames: { onlyInSnapshot: [], onlyOnThisMachine: [] }, path: { onlyInSnapshot: [], onlyOnThisMachine: [] }, differences: 0 };
  assert.match(renderDiff(diff, { color: false }), /No differences/i);
});

test('shouldColor respects NO_COLOR and TTY', () => {
  assert.equal(shouldColor({ isTTY: true }, { NO_COLOR: '1' }), false);
  assert.equal(shouldColor({ isTTY: false }, {}), false);
  assert.equal(shouldColor({ isTTY: true }, {}), true);
});
