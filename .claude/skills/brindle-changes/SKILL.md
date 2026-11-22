---
name: brindle-changes
description: Find what has changed in Brindle (the terminal emulator this site describes) since the site was last brought up to date, and report which pages, data and copy need updating. Use when asked "what changed in brindle", "is the site up to date", "refresh the site from brindle", "prepare the site for a new release", or before editing src/data/release.ts or any feature copy.
allowed-tools: Bash(.claude/skills/brindle-changes/gather.sh *), Bash(git -C ~/src/brindle show *), Bash(git -C ~/src/brindle diff *), Bash(git -C ~/src/brindle log *), Bash(gh release *)
---

# What changed in Brindle since the last site update

The site's copy is checked against Brindle's **specs on `origin/main`**
(`openspec/specs/*/spec.md`), not against the latest release: the site
describes the upcoming release. Download facts (version, date, asset names,
install commands) come from the latest **published** release.

The baseline is `syncedWith.commit` in `src/data/release.ts`: the Brindle
commit the site's copy was last checked against.

## Rules

- **Only Brindle's `main` branch counts.** Read `origin/main`, never other
  branches, open pull requests, or whatever `~/src/brindle` has checked out
  (it is often a stale feature branch). Commits are main's first-parent
  history; releases count only if their tag is on main and they are
  published (not drafts or pre-releases). The baseline must be a main commit.
- **Never change the Brindle checkout** (`~/src/brindle`). It is often on
  another branch and stale. Read with `git -C ~/src/brindle show
  origin/main:<path>`, `git diff <base> origin/main`, `git log`. `git fetch`
  is the only write, and `gather.sh` does it.
- **Only claim what a spec states.** Open proposals in `openspec/changes/`
  (not `archive/`) are unshipped: don't advertise them. Archived changes have
  already been merged into the specs.
- **Report first; edit only when asked.** This skill produces a report. If the
  user then asks to update the site, follow CLAUDE.md (release facts only in
  `src/data/release.ts`, colours only from tokens, visual check at desktop
  and mobile, light and dark), and bump `syncedWith` to the reviewed head
  commit and date in the same commit.

## Steps

1. Run `.claude/skills/brindle-changes/gather.sh` (pass a commit to diff from
   somewhere else). It prints the base and head, commits since the base,
   which spec files changed, new or removed capabilities, open and archived
   proposals, other user-facing files (README, CHANGELOG, packaging, docs,
   shell-integration) and the latest releases with their assets. If it says
   nothing is new, report that and stop.

2. Read the actual spec changes, not just the commit subjects:

   ```sh
   git -C ~/src/brindle diff <base> origin/main -- openspec/specs/<capability>/spec.md
   ```

   For a new capability, read the whole spec with `git show`. Classify each
   change as: new user-visible feature, changed behaviour (a site claim may
   now be wrong), removed feature, or internal/bug fix with no site impact.
   `fix:`, `ci:`, `chore:`, `docs:` and `refactor:` commits usually have no
   site impact; say so in one line rather than skipping them silently.

3. Check every claim the site makes that a change touches. Map capabilities
   to files:

   | Capability (openspec/specs/…) | Site files |
   | --- | --- |
   | session-restore, terminal-server, command-palette | `src/components/site/sessions-section.astro`, hero lead in `hero.astro` |
   | remote-connections, profiles, configuration | `remote-section.astro` (TOML sample, steps) |
   | shell-integration, program-status, program-progress, program-contexts, desktop-notifications | `awareness-section.astro`, tab strip in `brindle-window.astro` |
   | tabs, zones, terminal-rendering, ui-components | `brindle-window.astro`, `zone-header.astro`, `terminal-lines.astro`, `src/data/hero-terminal.ts` |
   | ui-theme-tokens | `themes` in `src/data/release.ts`, `theme-picker.tsx`, `src/styles/brindle-tokens.css` (generated: never hand-edit) |
   | release-process, desktop-integration, packaging/, README install steps | `release` in `src/data/release.ts`, `install-tabs.tsx` |
   | headline lines | `HEADLINES` in `typed-headline.tsx` |

   Grep the site for the feature's terms too (`grep -rni '<term>' src`): copy
   drifts outside this table. Look for platform caveats (Linux-only,
   Windows-only, needs a notification server with actions) that the site
   must repeat.

4. Check release facts against the latest release `gather.sh` lists (published
   and cut from main):
   `gh release view <tag> --repo scmccart/brindle --json tagName,publishedAt,assets`.
   Compare the version, date, asset file names (`linuxStem`/`windowsStem`)
   and install commands in `src/data/release.ts`. Note whether the release
   carries `brindle-ui-tokens.css`. If it does, the `refresh-tokens` workflow
   opens the token update itself: don't copy it by hand.

5. Write the report to
   `~/.cache/claude-tasks/brindle-site/brindle-changes-<head short sha>.md`,
   then reply with its path and a short summary. Sections:
   - **Range**: base → head, with dates; site version vs latest release.
   - **Site claims now wrong**: file, the claim, what the spec says now
     (quote the requirement), suggested fix. Most urgent first.
   - **New features worth showing**: what it is for a user, which section it
     fits, platform caveats.
   - **Release facts**: changes needed in `src/data/release.ts`, or "none".
   - **No site impact**: one line per commit or spec change and why.
   - **Upcoming (unshipped proposals)**: names only, for awareness.
