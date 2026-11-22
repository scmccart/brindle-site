#!/usr/bin/env bash
# Prints what changed in Brindle since the commit the site was last synced
# with (syncedWith.commit in src/data/release.ts). Read-only towards the
# Brindle checkout: it fetches origin but never checks out, switches or
# touches the working tree, because that checkout is often on another branch.
#
# Usage: gather.sh [BASE_COMMIT]   (default: syncedWith.commit)
# Env:   BRINDLE_REPO (default ~/src/brindle)

set -euo pipefail

site=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
brindle=${BRINDLE_REPO:-$HOME/src/brindle}
gh_repo=scmccart/brindle

base=${1:-$(grep -A2 'export const syncedWith' "$site/src/data/release.ts" \
  | sed -n 's/.*commit: "\([0-9a-f]\{7,40\}\)".*/\1/p')}
site_version=$(sed -n 's/^const version = "\(.*\)"/\1/p' "$site/src/data/release.ts")
[ -n "$base" ] || { echo "no syncedWith.commit in src/data/release.ts" >&2; exit 1; }

g() { git -C "$brindle" "$@"; }

# Only main matters: other branches, open PRs and whatever the checkout has
# checked out are ignored.
g fetch -q origin main
head=$(g rev-parse origin/main)
g merge-base --is-ancestor "$base" "$head" || {
  echo "base $base is not on origin/main; pass a main commit" >&2
  exit 1
}

echo "# Brindle changes since the last site sync"
echo
echo "base:  $(g log -1 --format='%h %cs %s' "$base")"
echo "head:  $(g log -1 --format='%h %cs %s' "$head")  (origin/main)"
echo "site release.ts version: $site_version"
echo "origin/main manifest version: $(g show origin/main:.release-please-manifest.json | sed -n 's/.*"\.": "\(.*\)".*/\1/p')"

if [ "$(g rev-parse "$base")" = "$head" ]; then
  echo
  echo "Nothing new: origin/main is the synced commit."
  exit 0
fi

echo
echo "## Commits on main (oldest first)"
g log --first-parent --reverse --format='%h %s' "$base..$head"

echo
echo "## Spec changes (openspec/specs)"
g diff --stat=120 "$base" "$head" -- openspec/specs | sed '$d'
added=$(g diff --name-only --diff-filter=A "$base" "$head" -- 'openspec/specs/*/spec.md')
removed=$(g diff --name-only --diff-filter=D "$base" "$head" -- 'openspec/specs/*/spec.md')
[ -n "$added" ] && { echo "new capabilities:"; echo "$added" | sed 's|openspec/specs/\(.*\)/spec.md|  \1|'; }
[ -n "$removed" ] && { echo "removed capabilities:"; echo "$removed" | sed 's|openspec/specs/\(.*\)/spec.md|  \1|'; }

echo
echo "## Open change proposals (not shipped; don't advertise)"
g ls-tree --name-only "$head" openspec/changes/ | { grep -v '/archive$' || true; } \
  | sed 's|openspec/changes/|  |'
echo "changed since base (archived = shipped, check its spec deltas above):"
g diff --name-only "$base" "$head" -- openspec/changes \
  | sed -n 's|openspec/changes/\(archive/\)\{0,1\}\([^/]*\)/.*|  \1\2|p' | sort -u
echo "  (end)"

echo
echo "## Other user-facing files changed"
g diff --stat=120 "$base" "$head" -- README.md CHANGELOG.md packaging docs shell-integration \
  | sed '$d' || true

echo
echo "## Releases cut from main (published, not drafts or pre-releases)"
latest=""
while read -r tag published; do
  sha=$(gh api "repos/$gh_repo/commits/$tag" --jq .sha 2>/dev/null) || continue
  if g merge-base --is-ancestor "$sha" "$head" 2>/dev/null; then
    echo "  $tag  $published  ${sha:0:7}"
    latest=${latest:-$tag}
  else
    echo "  ($tag skipped: not on main)"
  fi
done < <(gh release list --repo "$gh_repo" --limit 10 --exclude-drafts \
  --exclude-pre-releases --json tagName,publishedAt \
  --jq '.[] | .tagName + " " + .publishedAt')
[ -n "$latest" ] || { echo "  none"; exit 0; }
echo "assets of $latest:"
gh release view "$latest" --repo "$gh_repo" --json assets,publishedAt \
  --jq '"  published " + .publishedAt, (.assets[] | "  " + .name)'
