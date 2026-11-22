import { codeToTokens } from "shiki"

export interface Token {
  text: string
  /** Tailwind classes; empty for plain terminal foreground. */
  className: string
}

// TextMate scopes from Shiki's TOML grammar, mapped to Brindle's terminal
// ANSI colours so the code follows the selected theme. First match wins.
const scopeClasses: [prefix: string, className: string][] = [
  ["comment", "text-terminal-ansi-8"],
  ["meta.group", "font-bold text-terminal-ansi-4"], // [table] and [[array]]
  ["variable.other.key", "text-terminal-ansi-6"],
  ["string", "text-terminal-ansi-2"],
  ["constant", "text-terminal-ansi-5"], // booleans, numbers, dates
]

function classFor(scopes: string[]): string {
  for (const [prefix, className] of scopeClasses) {
    if (scopes.some((s) => s.startsWith(prefix))) return className
  }
  return ""
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/**
 * The highlighted lines as HTML for the inside of a <pre>, with no stray
 * whitespace between tokens. Text is escaped.
 */
export function tokensToHtml(lines: Token[][]): string {
  return lines
    .map((line) =>
      line
        .map(({ text, className }) =>
          className
            ? `<span class="${className}">${escapeHtml(text)}</span>`
            : escapeHtml(text)
        )
        .join("")
    )
    .join("\n")
}

/**
 * Tokenizes TOML at build time into lines of coloured tokens. Shiki only
 * parses here: its theme colours are discarded.
 */
export async function highlightToml(code: string): Promise<Token[][]> {
  const { tokens } = await codeToTokens(code, {
    lang: "toml",
    theme: "min-dark",
    includeExplanation: "scopeName",
  })
  return tokens.map((line) => {
    const out: Token[] = []
    for (const token of line) {
      for (const part of token.explanation ?? []) {
        const className = classFor(part.scopes.map((s) => s.scopeName))
        const last = out.at(-1)
        if (last && last.className === className) last.text += part.content
        else out.push({ text: part.content, className })
      }
    }
    return out
  })
}
