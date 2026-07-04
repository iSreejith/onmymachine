const SECRET_NAME = /(token|secret|key|passwd|password|pwd|credential|auth|private)/i;

export function isSecretName(name) {
  return SECRET_NAME.test(String(name));
}

export function redactValue(name, value) {
  return isSecretName(name) ? '[redacted]' : value;
}

export function normalizeHome(value, home, platform = process.platform) {
  if (!home || typeof value !== 'string') return value;
  const escaped = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flags = platform === 'win32' ? 'gi' : 'g';
  return value.replace(new RegExp(escaped, flags), '~');
}
