# Create-component Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repository-local Copilot skill that scaffolds accessible, tested UI components with runtime-specific templates and a targeted verifier.

**Architecture:** Keep the skill, templates, and verifier together under `.github/skills/create-component/`. The skill selects a React or Preact template from `package.json`; the Node verifier checks the generated output and delegates only the matching test to the project's `npm test` script.

**Tech Stack:** Markdown skill instructions, React/Preact TSX templates, Node.js built-ins (`node:test`, `node:assert`, `node:fs`, `node:child_process`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-06-create-component-skill-design.md`

## Global Constraints

- Product instructions specify React and `src/ui/<Component>/`; current `package.json` and UI code use Preact.
- Detect the installed runtime and use matching component and Testing Library templates.
- Call out the React/Preact discrepancy; do not silently migrate or mix framework APIs.
- Generated interface text and test names are French; code identifiers and filenames are English.
- Follow mobile-first and WCAG AA guidance, existing CSS conventions, strict TypeScript, and relevant UI/test instruction files.
- Do not add dependencies or make network calls.
- The verifier supports `src/ui/<ComponentName>/<ComponentName>.tsx` and `tests/ui/<ComponentName>.test.tsx`.

---

### Task 1: Build and test the component verifier

**Files:**
- Create: `.github/skills/create-component/scripts/verify-component.mjs`
- Create: `.github/skills/create-component/scripts/verify-component.test.mjs`

**Interfaces:**
- Consumes: CLI form `node .github/skills/create-component/scripts/verify-component.mjs <ComponentName> [--root <project-root>]`.
- Produces: An exit code of zero after successful preflight and targeted test, or a non-zero exit with a diagnostic for invalid input, layout, runtime, or test failure.

- [ ] **Step 1: Write failing Node tests for CLI validation**

Create `verify-component.test.mjs` with Node's built-in `node:test`. Use temporary directories and create fixtures containing `package.json`, the expected component and test files. Cover valid PascalCase names, invalid names, missing files, runtime mismatch, absent runtime, and both runtimes declared.

For the valid fixture, set its `test` script to a local recorder that writes its received arguments to a file. Assert the verifier invokes that script with exactly `tests/ui/Alert.test.tsx`; do not install packages or access the network.

```js
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const verifier = resolve(".github/skills/create-component/scripts/verify-component.mjs");

function runVerifierFixture({
  name = "Alert",
  dependencies = ["preact"],
  componentRuntime = "preact",
  testingLibrary = "preact",
  withComponent = true,
  withTest = true,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "create-component-"));
  const componentDir = join(root, "src", "ui", name);
  const testDir = join(root, "tests", "ui");
  const captureFile = join(root, "test-args.json");
  mkdirSync(componentDir, { recursive: true });
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      dependencies: Object.fromEntries(dependencies.map((runtime) => [runtime, "1.0.0"])),
      devDependencies: { [`@testing-library/${testingLibrary}`]: "1.0.0" },
      scripts: { test: "node record-test.mjs" },
    }),
  );
  writeFileSync(
    join(root, "record-test.mjs"),
    'import { writeFileSync } from "node:fs";\nwriteFileSync(process.env.VERIFY_CAPTURE_FILE, JSON.stringify(process.argv.slice(2)));',
  );
  if (withComponent) {
    writeFileSync(join(componentDir, `${name}.tsx`), `import "${componentRuntime}";`);
  }
  if (withTest) {
    writeFileSync(
      join(testDir, `${name}.test.tsx`),
      `import "@testing-library/${testingLibrary}";`,
    );
  }
  const result = spawnSync(
    process.execPath,
    [verifier, name, "--root", root],
    { encoding: "utf8", env: { ...process.env, VERIFY_CAPTURE_FILE: captureFile } },
  );
  return { result, root, captureFile };
}

test("rejette un nom qui ne respecte pas PascalCase", (context) => {
  const { result, root } = runVerifierFixture({ name: "alert-card" });
  context.after(() => rmSync(root, { recursive: true, force: true }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PascalCase/);
});

test("lance uniquement le test du composant valide", (context) => {
  const { result, root, captureFile } = runVerifierFixture();
  context.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(captureFile));
  assert.deepEqual(JSON.parse(readFileSync(captureFile, "utf8")), [
    "tests/ui/Alert.test.tsx",
  ]);
});
```

- [ ] **Step 2: Run the tests and confirm they fail because the verifier is absent**

Run: `node --test .github/skills/create-component/scripts/verify-component.test.mjs`
Expected: FAIL because the invoked verifier file does not exist.

- [ ] **Step 3: Implement the verifier**

Parse only the documented component name and optional `--root` argument. Resolve all expected paths from the chosen root. Accept a runtime only when exactly one of `react` and `preact` is declared in `dependencies` or `devDependencies`; check that the component imports that runtime and the test imports `@testing-library/react` or `@testing-library/preact` respectively. Emit actionable errors to stderr and stop before spawning tests on any failed check.

After preflight, spawn `npm test -- tests/ui/<ComponentName>.test.tsx` in the project root, propagate the child's exit code, and report spawn errors without treating them as success. Keep all validation in Node built-ins.

- [ ] **Step 4: Run the verifier tests**

Run: `node --test .github/skills/create-component/scripts/verify-component.test.mjs`
Expected: PASS for valid React and Preact fixtures and each invalid fixture; the recorder confirms the exact targeted test path.

- [ ] **Step 5: Commit the isolated verifier change**

```powershell
git add -- .github/skills/create-component/scripts/verify-component.mjs .github/skills/create-component/scripts/verify-component.test.mjs
git commit --only -m "feat: add component verifier" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" -- .github/skills/create-component/scripts/verify-component.mjs .github/skills/create-component/scripts/verify-component.test.mjs
```

### Task 2: Add runtime templates and skill instructions

**Files:**
- Create: `.github/skills/create-component/SKILL.md`
- Create: `.github/skills/create-component/templates/react/Component.tsx.tpl`
- Create: `.github/skills/create-component/templates/react/Component.test.tsx.tpl`
- Create: `.github/skills/create-component/templates/preact/Component.tsx.tpl`
- Create: `.github/skills/create-component/templates/preact/Component.test.tsx.tpl`
- Test: `.github/skills/create-component/scripts/verify-component.test.mjs`

**Interfaces:**
- Consumes: The CLI contract and output paths from Task 1.
- Produces: A skill workflow that selects one runtime pair, generates the prescribed component and test paths, and finishes with the verifier.

- [ ] **Step 1: Extend the built-in tests to check template pairs**

Read each template and assert it uses only the matching component runtime and Testing Library package, and contains the component-name placeholder used by `SKILL.md`. This prevents a React/Preact pair from being accidentally mixed.

- [ ] **Step 2: Run the tests to verify the new template checks fail**

Run: `node --test .github/skills/create-component/scripts/verify-component.test.mjs`
Expected: FAIL because the four template files do not exist.

- [ ] **Step 3: Add the four starter templates**

Each component template exports a typed, minimal component with an accessible semantic root and a clear `{{ComponentName}}` placeholder. Each test template imports the matching component and Testing Library API, renders it, and asserts an observable accessible role/name. Use French test descriptions and no domain or persistence logic.

- [ ] **Step 4: Write the skill workflow**

In `SKILL.md`, document the skill metadata and invocation purpose; require reading `.github/copilot-instructions.md` and the applicable UI/test instructions; inspect neighboring components and styles; select the runtime from `package.json`; warn about the current Preact/React discrepancy without changing dependencies; adapt both templates; create the named files in the paths specified by the spec; write behavior tests first; preserve accessibility, strict typing, offline, and dependency constraints; run the verifier and report its result.

- [ ] **Step 5: Run the complete skill checks**

Run: `node --test .github/skills/create-component/scripts/verify-component.test.mjs`
Expected: PASS for all verifier and template-pair tests.

Run the verifier against a temporary Preact component/test fixture in the repository and confirm it executes the actual targeted Vitest test. Remove only those exact temporary fixture files after the run. Also run `npm test -- tests/ui/<temporary-component>.test.tsx` when checking the Vitest invocation directly.

- [ ] **Step 6: Commit the skill and templates**

```powershell
git add -- .github/skills/create-component/SKILL.md .github/skills/create-component/templates .github/skills/create-component/scripts/verify-component.test.mjs
git commit --only -m "feat: add create component skill" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" -- .github/skills/create-component/SKILL.md .github/skills/create-component/templates .github/skills/create-component/scripts/verify-component.test.mjs
```

## Self-review

- Spec coverage: runtime-specific templates, generated paths, discrepancy warning, verifier preflight, targeted test delegation, no dependency/config changes, and diagnostics are covered by Tasks 1 and 2.
- Placeholder scan: template placeholders are intentional substitution tokens; all implementation steps and commands are specified.
- Type/CLI consistency: the CLI argument form, generated names, and test path agree across both tasks.
