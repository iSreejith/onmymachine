import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collect, detectShell, DEV_ENV_ALLOWLIST } from '../src/collect.js';

const fakeProbe = async (cmd) => {
  if (cmd === 'node') return 'v20.1.0';
  if (cmd === 'git') return 'git version 2.45.1';
  return null; // everything else "not installed"
};

const fakeEnv = {
  PATH: '/usr/bin:/home/sree/.local/bin',
  JAVA_HOME: '/home/sree/jdk',
  NPM_TOKEN: 'supersecret',
  SHELL: '/bin/zsh',
};

test('collect builds a v1 snapshot from injected probe and env', async () => {
  const snap = await collect({
    probe: fakeProbe, env: fakeEnv, platform: 'linux', home: '/home/sree', label: 'test-box',
  });
  assert.equal(snap.$schema, 'onmymachine/v1');
  assert.equal(snap.meta.label, 'test-box');
  assert.ok(snap.meta.createdAt);
  assert.equal(snap.system.platform, 'linux');
  assert.equal(snap.system.shell, 'zsh');
  assert.equal(snap.tools.node, '20.1.0');
  assert.equal(snap.tools.git, '2.45.1');
  assert.equal(snap.tools.docker, null);
  // env names all listed (sorted), values only for allowlisted vars
  assert.deepEqual(snap.env.names, Object.keys(fakeEnv).sort());
  assert.equal(snap.env.values.JAVA_HOME, '~/jdk');
  assert.equal(snap.env.values.NPM_TOKEN, undefined); // not allowlisted
  // PATH split and home-normalized
  assert.deepEqual(snap.env.path, ['/usr/bin', '~/.local/bin']);
});

test('minimal env still produces a valid snapshot', async () => {
  const snap = await collect({
    probe: async () => null,
    env: { NODE_ENV: 'dev', PATH: '' },
    platform: 'linux', home: '/home/sree',
  });
  assert.equal(snap.env.values.NODE_ENV, 'dev');
  assert.equal(snap.meta.label, undefined);
  assert.deepEqual(snap.env.path, []);
});

test('detectShell', () => {
  assert.equal(detectShell({ SHELL: '/bin/bash' }, 'linux'), 'bash');
  assert.equal(detectShell({ PSModulePath: 'x' }, 'win32'), 'powershell');
  assert.equal(detectShell({ ComSpec: 'C:\\Windows\\system32\\cmd.exe' }, 'win32'), 'cmd');
  assert.equal(detectShell({}, 'linux'), 'unknown');
});

test('DEV_ENV_ALLOWLIST contains the common suspects', () => {
  for (const n of ['JAVA_HOME', 'NODE_ENV', 'GOPATH', 'VIRTUAL_ENV']) {
    assert.ok(DEV_ENV_ALLOWLIST.includes(n), n);
  }
});
