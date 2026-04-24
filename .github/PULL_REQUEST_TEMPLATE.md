<!--
Thanks for the contribution! Please fill this out so the review goes fast.
See CONTRIBUTING.md for the full guide.
-->

## What this PR does

<!-- one or two sentences, no marketing -->

## Why

<!-- what problem does this solve? link the issue with `Closes #N` if applicable -->

Closes #

## How I tested it

<!-- how did you verify this? -->

- [ ] `npm test` passes locally
- [ ] `npm run lint` passes locally
- [ ] Ran the scanner against both `examples/broken-stack` and `examples/healthy-stack` and verified expected findings did not regress

## Checklist

- [ ] **No new runtime dependencies.** `soc-doctor` is zero-dep on purpose. If you believe a dep is necessary, open an issue to discuss first.
- [ ] **No real secrets or customer data** in code, tests, or fixtures. Use `acme-*` / `example.local` / placeholder passwords.
- [ ] If I added a new check: `src/checks/*.js` wired into `src/checks/index.js`, documented in `docs/rules.md`, with a broken-stack fixture seed and a healthy-stack counter-example, plus a test assertion in `test/scanner.test.js`.
- [ ] If I changed CI, `action.yml`, `LICENSE`, `package.json` dependencies, or `.github/**`, I understand this triggers a closer review.

## Anything reviewers should pay attention to

<!-- highlight tradeoffs, edge cases, or places you were unsure -->
