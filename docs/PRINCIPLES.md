# Development Principles

These are the values that govern every change to this repository. They apply equally to humans
and to AI agents. When in doubt, optimize for the long term.

## 1. Simplicity first
Prefer the simplest thing that fully solves the problem. Complexity must earn its place. A clear
Markdown playbook beats a clever script no one understands.

## 2. Modular and composable
Build small, single-purpose pieces that combine. Prompts compose into agents; playbooks feed
prompts; the data model underpins both. Avoid monoliths.

## 3. AI-first, human-approved
Design every asset so an AI agent can read it, understand it, and act on it without hand-holding.
But anything that touches the outside world (sending, booking, posting) is **drafted for human
review by default**. Automate only what has earned trust.

## 4. Documentation is part of the work
A change is not done until its documentation is updated. Every module has a `README.md`. Every
non-obvious decision is explained. Future-you and future-agents must be able to understand *why*,
not just *what*.

## 5. One source of truth per concern
Never duplicate the same fact in two places. Process lives here; live data lives in the connected
tools. Link, don't copy.

## 6. Reusable over one-off
Before writing something new, check whether it already exists. Prefer extending a reusable asset
over creating a near-duplicate. Generalize patterns once they appear a second time.

## 7. Production quality, no hacks
No throwaway shortcuts that we "will clean up later." If a thing is worth doing, do it cleanly the
first time. Quick hacks become permanent debt.

## 8. Long-term thinking
This repository will evolve for years. Make decisions that will still look reasonable in two
years. Favor conventions that scale over conveniences that don't.

## 9. Don't overengineer
The opposite failure mode is just as real. Do not build abstraction, configuration, or structure
before there is a concrete need. Create folders and frameworks when content demands them — not in
anticipation.

## 10. Bias to action with judgment
Identify problems and opportunities proactively. Propose better architecture. Improve what exists.
But explain reasoning for significant decisions and compare alternatives before committing.

---

### How to apply these as an AI agent
- Read the relevant module `README.md` before acting in it.
- Keep changes small and focused; one meaningful improvement per commit.
- Update documentation in the same change.
- When you spot debt or opportunity outside your task, note it in
  [`ROADMAP.md`](ROADMAP.md) rather than silently expanding scope.
