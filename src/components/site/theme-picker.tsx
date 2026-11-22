import { useSyncExternalStore } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { themes, type ThemeId } from "@/data/release"

const SWATCHES = [
  "bg-terminal-ansi-1",
  "bg-terminal-ansi-3",
  "bg-terminal-ansi-2",
  "bg-terminal-ansi-6",
  "bg-terminal-ansi-4",
  "bg-terminal-ansi-5",
] as const

/**
 * Switches the page between Brindle's built-in themes. Each button is drawn
 * in its own theme (a [data-theme] scope), so its colours come straight from
 * the exported tokens. The choice is kept in localStorage and applied before
 * paint by the layout's inline script.
 */
// The applied theme lives on <html data-theme>; watch it rather than copy it.
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  })
  return () => observer.disconnect()
}

const appliedTheme = () => document.documentElement.dataset.theme ?? ""
const serverTheme = () => ""

export function ThemePicker() {
  const current = useSyncExternalStore(
    subscribeTheme,
    appliedTheme,
    serverTheme
  )

  function pick(value: string) {
    const theme = themes.find((t) => t.id === value)
    if (!theme) return
    const root = document.documentElement
    root.dataset.theme = theme.id
    root.classList.toggle("dark", theme.dark)
    try {
      localStorage.setItem("brindle-theme", theme.id)
    } catch {
      // Private browsing: the choice lasts for this page view only.
    }
  }

  return (
    <ToggleGroup
      type="single"
      value={current}
      onValueChange={pick}
      aria-label="Theme"
      className="flex-wrap"
    >
      {themes.map((theme) => (
        <ToggleGroupItem
          key={theme.id}
          value={theme.id as ThemeId}
          data-theme={theme.id}
          className="h-11 gap-2.5 rounded-lg border border-border bg-background px-3.5 text-foreground hover:bg-background hover:text-foreground data-[state=on]:bg-background data-[state=on]:ring-2 data-[state=on]:ring-primary"
        >
          <span aria-hidden="true" className="flex gap-0.5">
            {SWATCHES.map((swatch) => (
              <span
                key={swatch}
                className={`h-4 w-1.5 rounded-[2px] ${swatch}`}
              />
            ))}
          </span>
          {theme.name}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
