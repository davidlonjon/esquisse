# Contributing Guide

## Principles

- Small, focused pull requests are easier to review and revert.
- Keep functions under \~50 lines and React components under \~200 lines. Extract hooks/components when logic grows.
- Prefer explicit types, discriminated unions, and type guards over `any`.
- All IPC interactions must be typed end-to-end and wrapped in try/catch.

## Checklist for Every Change

1. **Design** – Confirm requirements, update translations and documentation as needed.
2. **Types first** – Update `src/shared/types` + IPC contracts before renderer/main/preload changes.
3. **Implementation** – Keep business logic out of JSX, memoize expensive selectors, and respect hotkey/modal conventions.
4. **Quality gates** – Run `npm run validate` plus targeted tests (unit/E2E) that cover the change.
5. **Documentation** – Update README + `docs/` and mention the updates in your PR.
6. **Commit hygiene** – Clear message, no LLM co-author trailers.

## Pull Request Template

```
## Summary
- <short description>

## Testing
- [ ] npm run validate
- [ ] npm run test:run
- [ ] npm run test:e2e (if applicable)

## Documentation
- [ ] README updated
- [ ] docs/<file> updated (if needed)
```

Feel free to adapt the checklist per PR, but ensure reviewers can verify what changed, how it was tested, and how docs were updated.
