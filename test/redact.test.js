import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSecretName, redactValue, normalizeHome } from '../src/redact.js';

test('isSecretName flags secret-looking names', () => {
  for (const n of ['NPM_TOKEN', 'apiKey', 'DB_PASSWORD', 'passwd', 'AWS_SECRET_ACCESS_KEY', 'GH_AUTH', 'PRIVATE_PEM', 'my_credentials']) {
    assert.equal(isSecretName(n), true, n);
  }
  for (const n of ['PATH', 'JAVA_HOME', 'NODE_ENV', 'EDITOR']) {
    assert.equal(isSecretName(n), false, n);
  }
});

test('redactValue redacts only secret names', () => {
  assert.equal(redactValue('NPM_TOKEN', 'abc123'), '[redacted]');
  assert.equal(redactValue('JAVA_HOME', 'C:\\jdk'), 'C:\\jdk');
});

test('normalizeHome replaces home dir with ~', () => {
  assert.equal(normalizeHome('/home/sree/bin', '/home/sree', 'linux'), '~/bin');
  assert.equal(normalizeHome('C:\\Users\\PC\\bin', 'C:\\Users\\PC', 'win32'), '~\\bin');
  // case-insensitive on win32 only
  assert.equal(normalizeHome('c:\\users\\pc\\bin', 'C:\\Users\\PC', 'win32'), '~\\bin');
  assert.equal(normalizeHome('/HOME/SREE/bin', '/home/sree', 'linux'), '/HOME/SREE/bin');
  // untouched when unrelated or non-string
  assert.equal(normalizeHome('/usr/bin', '/home/sree', 'linux'), '/usr/bin');
  assert.equal(normalizeHome(undefined, '/home/sree', 'linux'), undefined);
});
