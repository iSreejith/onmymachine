import os from 'node:os';
import { exec, execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { TOOLS, parseVersion } from './registry.js';
import { redactValue, normalizeHome } from './redact.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

export const DEV_ENV_ALLOWLIST = [
  'NODE_ENV', 'JAVA_HOME', 'JDK_HOME', 'GOPATH', 'GOROOT', 'PYTHONPATH',
  'VIRTUAL_ENV', 'CONDA_DEFAULT_ENV', 'NVM_DIR', 'ANDROID_HOME',
  'CARGO_HOME', 'RUSTUP_HOME', 'DOTNET_ROOT', 'MAVEN_HOME', 'GRADLE_HOME',
  'DOCKER_HOST', 'KUBECONFIG', 'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY',
  'LANG', 'LC_ALL', 'TZ', 'TERM', 'SHELL', 'EDITOR',
];

export function defaultProbe(cmd, args, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const done = (err, stdout, stderr) => {
      const out = `${stdout || ''}\n${stderr || ''}`.trim(); // java prints to stderr
      resolve(out ? out : null);
    };
    const opts = { timeout: timeoutMs, windowsHide: true };
    if (process.platform === 'win32') {
      // cmd/args come only from the static TOOLS registry — never user input.
      // A shell is required on Windows to resolve .cmd shims (npm, pnpm, ...).
      exec(`${cmd} ${args.join(' ')}`, opts, done);
    } else {
      execFile(cmd, args, opts, done);
    }
  });
}

export function detectShell(env = process.env, platform = process.platform) {
  if (platform === 'win32') {
    if (env.PSModulePath) return 'powershell';
    if (env.ComSpec) return 'cmd';
    return 'unknown';
  }
  const sh = env.SHELL || '';
  return sh ? sh.split('/').pop() : 'unknown';
}

export async function collect({
  probe = defaultProbe,
  env = process.env,
  platform = process.platform,
  home = os.homedir(),
  label,
} = {}) {
  const toolEntries = await Promise.all(
    TOOLS.map(async (t) => [t.name, parseVersion(await probe(t.cmd, t.args))]),
  );

  const values = {};
  for (const name of DEV_ENV_ALLOWLIST) {
    if (env[name] !== undefined) {
      values[name] = redactValue(name, normalizeHome(env[name], home, platform));
    }
  }

  const rawPath = env.PATH ?? env.Path ?? '';
  const path = rawPath
    .split(platform === 'win32' ? ';' : ':')
    .filter(Boolean)
    .map((p) => normalizeHome(p, home, platform));

  return {
    $schema: 'onmymachine/v1',
    meta: {
      version: pkg.version,
      createdAt: new Date().toISOString(),
      ...(label ? { label } : {}),
    },
    system: {
      platform,
      release: os.release(),
      arch: os.arch(),
      shell: detectShell(env, platform),
    },
    tools: Object.fromEntries(toolEntries),
    env: { names: Object.keys(env).sort(), values, path },
  };
}
