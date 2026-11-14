# Team workflow

1. `git pull` before you start.
2. Make a branch per task: `git checkout -b feature/body-map`.
3. Commit small and often: `git commit -m "Add SVG body map"`.
4. Push and open a Pull Request, or merge to `main` yourself if it's a tiny, safe change.
5. Don't edit the same file as a teammate at the same time. Split work by file (see docs/ROADMAP.md).
6. `main` must always run (`npm run dev`) so you can demo at any moment.

Under time pressure, simplest rule: one owner per file, pull often, never force-push.
