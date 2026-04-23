# Contributing

Thanks for improving soc-doctor. The project is intentionally small: zero runtime dependencies, heuristic-first checks, and fixture-driven tests.

## Set up locally

Prerequisites:

- Node.js 18 or newer
- npm

```bash
git clone https://github.com/tanushgupta/soc-doctor.git
cd soc-doctor
npm test
```

## Propose a new check

A good check should catch a production-relevant SOC stack failure mode with a simple, reviewable heuristic.

1. Add the check implementation under `src/checks/`.
   - Use a kebab-case filename that matches the check id, for example `src/checks/example-risk.js`.
   - Export a check object with `id`, `title`, `category`, `defaultSeverity`, `recommendation`, and `async run(context)`.
   - Return findings through `makeFinding(...)` from `src/lib/check-helpers.js`.

2. Wire the check into `src/checks/index.js`.
   - Import the new check.
   - Add it to `allChecks`.

3. Document the rule in `docs/rules.md`.
   - Add a numbered section using the check id as the heading.
   - List exactly what the heuristic flags.

4. Add a before/after example in `docs/before-after.md`.
   - Show the broken fixture snippet.
   - Show the expected finding output.
   - Show the healthy version and why it avoids the issue.

5. Seed the broken fixture.
   - Add the smallest realistic misconfiguration under `examples/broken-stack/`.
   - Prefer an existing file when the failure mode naturally belongs there.
   - Add a new fixture file only when it makes the example clearer.

6. Harden the healthy fixture.
   - Update `examples/healthy-stack/` with the corresponding safe configuration.
   - The healthy stack should not emit high or critical findings for the new check.

7. Update the test assertion.
   - Add `assert.ok(ids.has('your-check-id'))` to `test/scanner.test.js`.
   - Keep the healthy fixture test passing.

8. Run verification.

```bash
npm test
npm run lint
```

## Report a bug

Please include enough detail for someone else to reproduce the finding.

Bug reports should include:

- Minimal reproducer: the smallest config snippet or fixture layout that triggers the issue.
- Expected finding: what soc-doctor should have reported, or that it should have stayed quiet.
- Actual finding: the check id, severity, message, and evidence soc-doctor returned.
- Config snippet: include the relevant YAML, TOML, JSON, env, or markdown. Redact secrets and do not paste private values.
- Command used: for example `npx soc-doctor scan ./my-stack`.

## Run existing tests

```bash
npm test
npm run lint
```

`npm test` runs the Node test suite. `npm run lint` syntax-checks the CLI, source files, checks, and library helpers.

## Style guide

- Keep zero runtime dependencies.
- Prefer heuristic-first checks that are easy to understand and cheap to run.
- Use `makeFinding(file, message, recommendation, evidence, severity)` for findings.
- Keep check ids stable and kebab-case.
- Make evidence useful but short. Mask or avoid secrets.
- Prefer focused checks over broad policy engines.
- Keep fixture changes minimal and realistic.
- Update docs and tests in the same change as the check.
