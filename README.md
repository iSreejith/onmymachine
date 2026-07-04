# onmymachine

> Kill "works on my machine" in 10 seconds.

<!-- TODO(record): asciinema/vhs demo before launch -->
![demo](docs/demo.gif)

## The problem

Your code runs fine. Your teammate pulls it and it crashes. Now you're playing
20 questions on Slack: *"What Node version? What's in your PATH? Do you even
have Docker?"*

Stop asking. Diff the machines.

## Quick start

**You** (the person it works for):

```sh
npx onmymachine
```

This writes `onmymachine.json` — a fingerprint of your dev environment.
Send that file to your teammate (Slack, email, carrier pigeon).

**Your teammate** (the person it's broken for):

```sh
npx onmymachine diff onmymachine.json
```

```
Tools
  ✖ node           snapshot: 20.11.0   this machine: 22.3.0
  ● docker         in snapshot (27.1.1) — missing here

Env values
  ✖ JAVA_HOME      snapshot: ~/jdk-21   this machine: ~/jdk-17

✓ 24 tools match
3 differences found — one of these might be your "works on my machine".
```

Done. No more guessing.

## What it captures

- **Tool versions** — node, npm, python, git, docker, java, go, rustc, and ~20 more
- **System** — OS, release, architecture, shell
- **Env vars** — all *names*; values only for dev-relevant vars (`JAVA_HOME`, `GOPATH`, ...)
- **PATH** — every entry, so "it's not even on my PATH" gets caught too

## Privacy

Built to be safe to share:

- **No hostname, no username** — never collected
- Paths under your home directory become `~`
- Anything that looks like a secret (`*_TOKEN`, `*_KEY`, `*PASSWORD*`, ...) is `[redacted]`
- **Zero network calls, zero telemetry, zero dependencies** — read the entire
  source over coffee

## More

```sh
onmymachine --label "sree-laptop"   # name your snapshot
onmymachine diff snap.json --all    # also show what matches
onmymachine diff snap.json --json   # machine-readable diff
```

**CI drift guard:** commit a golden snapshot of your build box; `onmymachine
diff golden.json` exits `1` when the runner drifts.

## FAQ

**Why not just use Docker?**
Because the bug report says "works on my machine", not "works in my container".
Real development happens on hosts — with host Node, host PATH, host env vars.

**Windows?**
First-class. Windows, macOS, and Linux.

**Does it upload my snapshot anywhere?**
Never. It writes a local file. You choose who sees it.

## Contributing

Issues and PRs welcome. The whole tool is ~400 lines of dependency-free
Node — `npm test` runs everything.

## License

[MIT](LICENSE)
