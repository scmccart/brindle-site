// Facts that change with each Brindle release. Refresh this file from the
// latest release (https://github.com/scmccart/brindle/releases); pages read
// these values instead of repeating them.

const repo = "https://github.com/scmccart/brindle"
const version = "0.3.0"
const tag = `v${version}`

const linuxStem = `brindle-${version}-x86_64-unknown-linux-gnu`
const windowsStem = `brindle-${version}-x86_64-pc-windows-msvc`

const download = (file: string) => `${repo}/releases/download/${tag}/${file}`

export const release = {
  version,
  tag,
  releasedOn: "4 November 2026",
  arch: "x86-64",
  repo,
  releasesUrl: `${repo}/releases`,
  changelogUrl: `${repo}/blob/main/CHANGELOG.md`,
  issuesUrl: `${repo}/issues`,
  linux: {
    file: `${linuxStem}.tar.gz`,
    url: download(`${linuxStem}.tar.gz`),
    glibcFrom: "Ubuntu 26.04",
    install: [
      "sha256sum -c --ignore-missing SHA256SUMS",
      `tar -xzf ${linuxStem}.tar.gz`,
      `install -Dm755 -t ~/.local/bin ${linuxStem}/brindle \\`,
      `  ${linuxStem}/brindle-remote-linux-x86_64`,
      "~/.local/bin/brindle --install-desktop   # launcher entry and icon",
    ],
  },
  windows: {
    file: `${windowsStem}.zip`,
    url: download(`${windowsStem}.zip`),
    minimum: "Windows 11",
    install: [
      `Expand-Archive ${windowsStem}.zip \``,
      "  -DestinationPath $env:LOCALAPPDATA\\Programs\\brindle",
      "& $env:LOCALAPPDATA\\Programs\\brindle\\brindle.exe --install-desktop   # Start Menu shortcut",
    ],
  },
} as const

// The built-in themes, in the order Brindle lists them. Their colours come
// from src/styles/brindle-tokens.css through [data-theme] rules.
export const themes = [
  { id: "brindle-light", name: "Brindle Light", dark: false },
  { id: "brindle-dark", name: "Brindle Dark", dark: true },
  { id: "tokyo-night", name: "Tokyo Night", dark: true },
  { id: "gruvbox-dark", name: "Gruvbox Dark", dark: true },
  { id: "solarized-dark", name: "Solarized Dark", dark: true },
] as const

export type ThemeId = (typeof themes)[number]["id"]
