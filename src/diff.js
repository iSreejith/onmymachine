function pairStatus(a, b) {
  if (a === b) return 'match';
  if (a != null && b != null) return 'mismatch';
  return a != null ? 'only-in-snapshot' : 'only-on-this-machine';
}

function setDiff(a, b) {
  const sa = new Set(a), sb = new Set(b);
  return {
    onlyInSnapshot: [...sa].filter(x => !sb.has(x)).sort(),
    onlyOnThisMachine: [...sb].filter(x => !sa.has(x)).sort(),
  };
}

export function diffSnapshots(snapshot, current) {
  const tools = [];
  const toolNames = new Set([
    ...Object.keys(snapshot.tools ?? {}),
    ...Object.keys(current.tools ?? {}),
  ]);
  for (const name of [...toolNames].sort()) {
    const a = snapshot.tools?.[name] ?? null;
    const b = current.tools?.[name] ?? null;
    tools.push({ name, snapshot: a, current: b, status: pairStatus(a, b) });
  }

  const system = ['platform', 'release', 'arch', 'shell'].map((key) => {
    const a = snapshot.system?.[key] ?? null;
    const b = current.system?.[key] ?? null;
    return { key, snapshot: a, current: b, status: a === b ? 'match' : 'mismatch' };
  });

  const envValues = [];
  const valueNames = new Set([
    ...Object.keys(snapshot.env?.values ?? {}),
    ...Object.keys(current.env?.values ?? {}),
  ]);
  for (const name of [...valueNames].sort()) {
    const a = snapshot.env?.values?.[name] ?? null;
    const b = current.env?.values?.[name] ?? null;
    envValues.push({ name, snapshot: a, current: b, status: pairStatus(a, b) });
  }

  const envNames = setDiff(snapshot.env?.names ?? [], current.env?.names ?? []);
  const path = setDiff(snapshot.env?.path ?? [], current.env?.path ?? []);

  const differences =
    tools.filter(t => t.status !== 'match').length +
    system.filter(s => s.status !== 'match').length +
    envValues.filter(v => v.status !== 'match').length +
    envNames.onlyInSnapshot.length + envNames.onlyOnThisMachine.length +
    path.onlyInSnapshot.length + path.onlyOnThisMachine.length;

  return { tools, system, envValues, envNames, path, differences };
}
