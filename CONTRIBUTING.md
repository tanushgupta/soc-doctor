# Contributing to soc-doctor

Thanks for considering a contribution. This guide tells you how to set up, what we accept, and how review works.

## How review works

- **Every change goes through a pull request.** Direct pushes to `main` are blocked for everyone, including the maintainer.
- **Every PR is auto-assigned to the maintainer** via `.github/CODEOWNERS`. Your PR will not merge until they approve.
- **CI must be green.** `npm test`, `npm run lint`, and the self-test action against both fixture stacks are required status checks.
- **Every conversation must be resolved** before merge. If a reviewer comments, acknowledge or fix before the PR ships.
- **First-time contributors:** GitHub will hold your PR's Actions runs until the maintainer approves them. This is a platform-level guard, not a statement about you.

If the review is slow, please be patient — this is a small project, review happens in batches.

## Ground rules

1. **Zero runtime dependencies.** `soc-doctor` deliberately runs on the Node standard library. If you believe a dependency is necessary, open an issue first so we can talk about the tradeoff. Dev-only tooling (test frameworks, linters) is still off the table unless it solves something we genuinely cannot with `node --test` + `node --check`.
2. **Heuristic-first, not AST-perfect.** Rules use regex and structural patterns. That is the current design. Full AST parsing is on the roadmap — see `.github` issues tagged `roadmap`.
3. **No real secrets, customer data, or customer-identifying strings** in code, tests, or fixtures. Use `acme-*`, `example.local`, `ExamplePass@123`, placeholder webhooks. Assume everything in the repo is public (because it is).
4. **Keep the broken-stack realistic.** Fixtures should look like things we have actually seen break production. Don't add contrived examples that exist only to trip a specific regex.
5. **Keep the healthy-stack clean.** Every new check must have a counter-example in `examples/healthy-stack/` that the scanner correctly returns zero findings for.

## Setup

```bash
git clone https://github.com/tanushgupta/soc-doctor.git
cd soc-doctor
npm test
npm run lint
```

There are no dependencies to install — `npm test` and `npm run lint` both use `node --test` / `node --check` directly. Node 18 or newer is required.

Run the scanner against the fixtures to confirm your environment works:

```bash
node bin/soc-doctor.js scan ./examples/broken-stack
node bin/soc-doctor.js scan ./examples/healthy-stack
```

## Adding a new check

1. **Write the check** in `src/checks/<id>.js`. Export a `const <id>Check = { id, title, category, defaultSeverity, recommendation, async run(context) }`. Return an array of findings built with `makeFinding(file, message, recommendation, evidence, severity)`.
2. **Wire it in** `src/checks/index.js` — add the import and push onto `allChecks`.
3. **Document it** in `docs/rules.md` with a short list of what it flags.
4. **Add a broken-stack fixture** under `examples/broken-stack/` that the check actually fires on. If an existing fixture file can be enriched, enrich it; don't add a new fixture just to trip one rule.
5. **Add a healthy-stack counter-example** under `examples/healthy-stack/` that the check does not fire on. The healthy fixture must remain at zero critical + high findings overall.
6. **Add the assertion** to `test/scanner.test.js`: `assert.ok(ids.has('<id>'))`.
7. **Add a section** to `docs/before-after.md` with the broken snippet, the scanner output, the healthy snippet, and a one-line "why it works now".
8. Run `npm test` — both fixture tests must pass.

## Reporting a bug

Open an issue with:

- **What you ran** — the command line, including `--format` / `--fail-on` flags.
- **What you expected** — either "scanner should have flagged this" + a config snippet, or "scanner should not have flagged this" + a config snippet.
- **What happened** — the output the scanner actually produced.
- **Node version** — `node --version`.

If the config you're running against contains real secrets, **do not paste it**. Reproduce the bug with a sanitized snippet first.

## Sensitive-path changes

Changes to any of these paths trigger deeper review:

- `.github/workflows/**` — CI can be abused to steal secrets or publish hostile releases.
- `action.yml` — same reason, but for downstream users of the action.
- `LICENSE`, `package.json` `dependencies`, `scripts`, `bin`, `type`, `files`, `engines` — anything that affects the published artifact or its terms.
- `CODEOWNERS`, `CONTRIBUTING.md`, branch protection.

These aren't off-limits, but expect the review to take longer and to ask more questions.

## Labels

- [`bug`](https://github.com/tanushgupta/soc-doctor/labels/bug) — something is broken
- [`check idea`](https://github.com/tanushgupta/soc-doctor/labels/check%20idea) — a proposed new detection rule
- [`roadmap`](https://github.com/tanushgupta/soc-doctor/labels/roadmap) — planned feature or structural work
- [`good first issue`](https://github.com/tanushgupta/soc-doctor/labels/good%20first%20issue) — small, scoped tasks for newcomers
- [`enhancement`](https://github.com/tanushgupta/soc-doctor/labels/enhancement) — everything else that is not a bug

## License

By submitting a pull request you agree that your contribution is made under the [MIT License](./LICENSE).
