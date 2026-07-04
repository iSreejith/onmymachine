const VERSION_RE = /\d+\.\d+(?:\.\d+)?/;

export function parseVersion(output) {
  if (!output) return null;
  const m = String(output).match(VERSION_RE);
  return m ? m[0] : null;
}

const v = (name, cmd = name, args = ['--version']) => ({ name, cmd, args });

export const TOOLS = [
  v('node'),
  v('npm'),
  v('pnpm'),
  v('yarn'),
  v('bun'),
  v('deno'),
  v('python'),
  v('python3'),
  v('pip'),
  v('git'),
  v('docker'),
  v('java', 'java', ['-version']),
  v('go', 'go', ['version']),
  v('rustc'),
  v('cargo'),
  v('ruby'),
  v('gem'),
  v('php'),
  v('composer'),
  v('dotnet'),
  v('kubectl', 'kubectl', ['version', '--client']),
  v('terraform', 'terraform', ['version']),
  v('aws'),
  v('gcc'),
  v('clang'),
  v('make'),
  v('cmake'),
];
