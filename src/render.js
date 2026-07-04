export function shouldColor(stream = process.stdout, env = process.env) {
  return Boolean(stream.isTTY) && !env.NO_COLOR;
}

function palette(enabled) {
  const wrap = (code) => (s) => (enabled ? `\x1b[${code}m${s}\x1b[0m` : String(s));
  return {
    red: wrap('31'), green: wrap('32'), yellow: wrap('33'),
    cyan: wrap('36'), bold: wrap('1'), dim: wrap('2'),
  };
}

const pad = (s, n) => String(s).padEnd(n);

export function renderSnapshotSummary(snapshot, { color = false } = {}) {
  const c = palette(color);
  const lines = [];
  const label = snapshot.meta?.label ? ` (${snapshot.meta.label})` : '';
  lines.push(c.bold(`onmymachine snapshot${label}`));
  const sys = snapshot.system ?? {};
  lines.push(c.dim(`${sys.platform} ${sys.release} · ${sys.arch} · shell: ${sys.shell}`));
  lines.push('');
  const tools = Object.entries(snapshot.tools ?? {});
  const installed = tools.filter(([, v]) => v);
  for (const [name, version] of installed) {
    lines.push(`  ${c.green('✓')} ${pad(name, 12)} ${version}`);
  }
  const missing = tools.length - installed.length;
  if (missing > 0) lines.push(c.dim(`  ${missing} of ${tools.length} tools not detected`));
  lines.push('');
  lines.push(c.dim(`${(snapshot.env?.names ?? []).length} env var names · ${(snapshot.env?.path ?? []).length} PATH entries`));
  return lines.join('\n');
}

export function renderDiff(diff, { color = false, all = false } = {}) {
  const c = palette(color);
  const lines = [];

  const statusLine = (label, a, b, status) => {
    if (status === 'mismatch') {
      return `  ${c.red('✖')} ${pad(label, 14)} snapshot: ${c.red(a)}   this machine: ${c.red(b)}`;
    }
    if (status === 'only-in-snapshot') {
      return `  ${c.yellow('●')} ${pad(label, 14)} in snapshot (${a}) — ${c.yellow('missing here')}`;
    }
    if (status === 'only-on-this-machine') {
      return `  ${c.yellow('●')} ${pad(label, 14)} on this machine (${b}) — ${c.yellow('missing in snapshot')}`;
    }
    return `  ${c.green('✓')} ${pad(label, 14)} ${a}`;
  };

  const section = (title, rows, toLine) => {
    const visible = rows.filter(r => all || r.status !== 'match');
    if (visible.length === 0) return;
    lines.push(c.bold(title));
    for (const r of visible) lines.push(toLine(r));
    lines.push('');
  };

  section('Tools', diff.tools, r => statusLine(r.name, r.snapshot, r.current, r.status));
  section('System', diff.system, r => statusLine(r.key, r.snapshot, r.current, r.status));
  section('Env values', diff.envValues, r => statusLine(r.name, r.snapshot, r.current, r.status));

  const listSection = (title, group) => {
    if (group.onlyInSnapshot.length === 0 && group.onlyOnThisMachine.length === 0) return;
    lines.push(c.bold(title));
    for (const n of group.onlyInSnapshot) lines.push(`  ${c.yellow('●')} ${n} — only in snapshot`);
    for (const n of group.onlyOnThisMachine) lines.push(`  ${c.yellow('●')} ${n} — only on this machine`);
    lines.push('');
  };
  listSection('Env var names', diff.envNames);
  listSection('PATH entries', diff.path);

  const matched = diff.tools.filter(t => t.status === 'match').length;
  if (matched > 0) lines.push(c.green(`✓ ${matched} tools match`));
  lines.push(
    diff.differences === 0
      ? c.green('No differences — same setup. The bug is elsewhere. 🙃')
      : c.bold(`${diff.differences} differences found — one of these might be your "works on my machine".`),
  );
  return lines.join('\n');
}
