# Repository conventions

- Use UTF-8, LF, ES modules, and two-space indentation. Keep browser modules separate from Node-only tools.
- Keep rendering deterministic. Derive motion from the requested time and seeded randomness, and keep mutable playback state outside scene renderers.
- Share pose data through `src/rig`; individual scenes own their visual interpretation. Keep scene coordinates local and let the compositor own camera transforms.
- Keep dependency versions pinned. Record third-party sources and applicable licenses in `THIRD_PARTY_NOTICES.md`; preserve their notices.
- Use the scripts documented in `README.md`. Validate behavioral changes with the relevant checks; inspect rendered images for visual changes.
- Do not overwrite unrelated user changes, add real product branding, or import reference media or unrecorded third-party code.
- Keep project plans, task breakdowns, implementation sequences, and progress logs out of this file. Use `PLAN.md` and `docs/STATUS.md` for those records.
