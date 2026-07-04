import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffSnapshots } from '../src/diff.js';

const base = (over = {}) => ({
  $schema: 'onmymachine/v1',
  meta: { version: '0.1.0', createdAt: 'x' },
  system: { platform: 'linux', release: '6.1', arch: 'x64', shell: 'bash' },
  tools: { node: '20.1.0', git: '2.45.1', docker: null },
  env: { names: ['PATH', 'JAVA_HOME'], values: { JAVA_HOME: '/jdk' }, path: ['/usr/bin'] },
  ...over,
});

test('identical snapshots produce zero differences', () => {
  const d = diffSnapshots(base(), base());
  assert.equal(d.differences, 0);
  assert.ok(d.tools.every(t => t.status === 'match'));
});

test('tool statuses cover all four cases', () => {
  const a = base({ tools: { node: '20.1.0', git: '2.45.1', docker: '27.0', rustc: null } });
  const b = base({ tools: { node: '22.3.0', git: '2.45.1', docker: null, rustc: '1.79.0' } });
  const d = diffSnapshots(a, b);
  const byName = Object.fromEntries(d.tools.map(t => [t.name, t.status]));
  assert.equal(byName.node, 'mismatch');
  assert.equal(byName.git, 'match');
  assert.equal(byName.docker, 'only-in-snapshot');
  assert.equal(byName.rustc, 'only-on-this-machine');
  assert.equal(d.differences, 3);
});

test('system, env names, env values and PATH diffs are detected', () => {
  const a = base();
  const b = base({
    system: { platform: 'win32', release: '10.0', arch: 'x64', shell: 'powershell' },
    env: { names: ['PATH', 'GOPATH'], values: { JAVA_HOME: '/other-jdk' }, path: ['/usr/bin', '/opt/bin'] },
  });
  const d = diffSnapshots(a, b);
  assert.equal(d.system.find(s => s.key === 'platform').status, 'mismatch');
  assert.equal(d.system.find(s => s.key === 'arch').status, 'match');
  assert.deepEqual(d.envNames.onlyInSnapshot, ['JAVA_HOME']);
  assert.deepEqual(d.envNames.onlyOnThisMachine, ['GOPATH']);
  assert.equal(d.envValues.find(v => v.name === 'JAVA_HOME').status, 'mismatch');
  assert.deepEqual(d.path.onlyOnThisMachine, ['/opt/bin']);
  assert.ok(d.differences >= 6);
});

test('tolerates missing sections in malformed snapshots', () => {
  const d = diffSnapshots({}, base());
  assert.ok(d.differences > 0);
});
