# Recording script for docs/demo.gif — see docs/vhs.Dockerfile
Output docs/demo.gif

Set FontSize 18
Set Width 1100
Set Height 750
Set Theme "Catppuccin Mocha"
Set TypingSpeed 35ms
Set Shell bash

# --- hidden setup: make `npx onmymachine` call the local checkout, and
# --- fake a teammate snapshot with a few juicy differences
Hide
Type `npx() { shift; node /vhs/bin/onmymachine.js "$@"; }` Enter
Type "export SHELL=/bin/bash" Enter
Type "cd /tmp" Enter
Type "node /vhs/bin/onmymachine.js snapshot -o /tmp/sree.json --label sree-laptop" Enter
Sleep 8s
Type `node -e "const fs=require('fs');const s=JSON.parse(fs.readFileSync('/tmp/sree.json'));s.tools.node='20.11.0';s.tools.docker='27.1.1';s.env.values.JAVA_HOME='~/jdk-21';fs.writeFileSync('/tmp/sree.json',JSON.stringify(s))"` Enter
Type "clear" Enter
Show

Type "# Teammate: 'the build fails on my machine'"
Sleep 600ms
Enter
Type "# You: 'works on mine...'. Time to settle this."
Sleep 800ms
Enter
Sleep 500ms

Type "npx onmymachine"
Sleep 600ms
Enter
Sleep 9s

Type "# Send onmymachine.json over. Teammate runs:"
Sleep 800ms
Enter
Type "npx onmymachine diff sree.json"
Sleep 600ms
Enter
Sleep 9s

Sleep 4s
