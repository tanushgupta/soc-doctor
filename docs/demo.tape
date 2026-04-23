# soc-doctor demo — regenerate with: vhs docs/demo.tape

Output docs/demo.gif

Require node
Require head

Set Shell "zsh"
Set FontSize 14
Set Width 1000
Set Height 520
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms
Set Padding 20

# Enter the repo silently
Hide
Type "cd /Users/tanushgupta/Downloads/soc-doctor && clear"
Enter
Sleep 400ms
Show

Type "# soc-doctor — production readiness scanner"
Sleep 800ms
Enter
Sleep 300ms

Type "node bin/soc-doctor.js scan examples/broken-stack | head -24"
Sleep 400ms
Enter
Sleep 4500ms

Type "clear"
Enter
Sleep 300ms

Type "# same scanner, now on a hardened stack"
Sleep 600ms
Enter
Sleep 200ms

Type "node bin/soc-doctor.js scan examples/healthy-stack"
Sleep 400ms
Enter
Sleep 2500ms
