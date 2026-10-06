# Create-component skill design

## Purpose

Add a repository-local Copilot skill that scaffolds accessible, tested UI
components following the FrigoMalin project instructions. The skill must not
change the framework, dependencies, or application behavior as a side effect.

## Repository constraints

- Product instructions specify React and `src/ui/<Component>/`.
- The current `package.json` and UI code use Preact; the skill must detect the
  installed runtime and use matching component and Testing Library templates.
- The skill must call out the React/Preact discrepancy and must not silently
  migrate or mix framework APIs.
- Generated interface text and test names are French; code identifiers and
  filenames are English.
- Follow mobile-first and WCAG AA guidance, existing CSS conventions, strict
  TypeScript, and the relevant UI/test instruction files.
- Do not add dependencies or make network calls.

## Skill files and flow

Create `.github/skills/create-component/` with:

- `SKILL.md`: when to use the skill, required repository inspection, framework
  selection, component/test generation workflow, accessibility and product
  constraints, and required validation.
- `templates/react/Component.tsx.tpl` and
  `templates/react/Component.test.tsx.tpl`.
- `templates/preact/Component.tsx.tpl` and
  `templates/preact/Component.test.tsx.tpl`.
- `scripts/verify-component.mjs`: a Node built-in-only verifier.

The skill generates `src/ui/<ComponentName>/<ComponentName>.tsx` and
`tests/ui/<ComponentName>.test.tsx`. It inspects the existing UI and CSS before
adapting the templates, writes the test before implementation when behavior is
specified, then runs the verifier. Templates are starting points, not a reason
to introduce arbitrary props, styles, or behavior.

## Verification behavior

Invoke the script with a PascalCase component name and optional project root.
It validates the name, required output paths, and agreement between the
component/test imports and the single active React or Preact runtime declared
in `package.json`. Missing or ambiguous runtimes and malformed outputs produce
clear diagnostics and a non-zero exit status. On successful preflight, it runs
only the associated test using the repository's `npm test` script and returns
the test command's exit status.

The checker is intentionally a small structural guard, not a JSX parser,
accessibility audit, or replacement for project typecheck/lint/build checks.

## Acceptance checks

1. The skill and both runtime template pairs exist in the prescribed directory.
2. The verifier accepts valid React and Preact fixtures and rejects invalid
   names, missing files, runtime mismatches, and ambiguous runtime selection.
3. A valid Preact component in this repository reaches the targeted Vitest
   command; failures are surfaced with a non-zero status.
4. Authoring the skill adds no dependencies and changes no framework
   configuration or existing application source files.
