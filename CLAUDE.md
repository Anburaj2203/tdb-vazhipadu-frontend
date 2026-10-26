# CLAUDE.md

Guidance for Claude Code working in this repository.

This file is the **single register** for this repo's values. Every skill, convention and agent in
`.claude/` points here rather than restating a value.

## Project-specific

- **Stack**: React
- **Package Manager**: npm
- **Gate Commands**: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- **Conventions Skills**: react-conventions
- **Reviewer Agents**: senior-react-engineer
- **Default Branch**: main
- **Protected Branches**: main
- **Promotion Chain**: main
- **Branch Name**: `<type>/<short-slug>`, where type is one of feat, fix, chore, docs, refactor or test
- **PR Title**: `<type>: <summary>`
- **PR Title Regex**: `^(feat|fix|chore|docs|refactor|test): .+$`
- **PR Template**: `.github/PULL_REQUEST_TEMPLATE.md`
- **Merge Method**: squash
- **Version Bump**: NULL
- **Milestones**: NULL
- **Project Board**: NULL
- **Label Routing**: every change touching `src/` routes to react-conventions and senior-react-engineer
- **Assign On Start**: NULL
