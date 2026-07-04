import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS, parseVersion } from '../src/registry.js';

test('parseVersion extracts version from typical tool banners', () => {
  assert.equal(parseVersion('v22.3.0'), '22.3.0');
  assert.equal(parseVersion('Python 3.12.4'), '3.12.4');
  assert.equal(parseVersion('git version 2.45.1.windows.1'), '2.45.1');
  assert.equal(parseVersion('openjdk version "21.0.3" 2024-04-16'), '21.0.3');
  assert.equal(parseVersion('go version go1.22.5 windows/amd64'), '1.22.5');
  assert.equal(parseVersion('Docker version 27.1.1, build 6312585'), '27.1.1');
  assert.equal(parseVersion('rustc 1.79.0 (129f3b996 2024-06-10)'), '1.79.0');
  assert.equal(parseVersion(''), null);
  assert.equal(parseVersion(null), null);
  assert.equal(parseVersion('no digits here'), null);
});

test('registry entries are well-formed and unique', () => {
  assert.ok(TOOLS.length >= 20);
  const names = TOOLS.map(t => t.name);
  assert.equal(new Set(names).size, names.length);
  for (const t of TOOLS) {
    assert.equal(typeof t.name, 'string');
    assert.equal(typeof t.cmd, 'string');
    assert.ok(Array.isArray(t.args));
  }
});
