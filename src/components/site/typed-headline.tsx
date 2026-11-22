import { useEffect, useState, useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

const HEADLINES = [
  "Close the terminal. Your programs keep running.",
  "See what every tab is doing.",
  "Lose the connection. Keep the session.",
]

const TYPE_MS = 48
const FULL_STOP_MS = 260
const DELETE_MS = 22
const HOLD_MS = 2600
const GAP_MS = 320

type Phase = "type" | "hold" | "delete"

const REDUCE = "(prefers-reduced-motion: reduce)"

function subscribeMotion(onChange: () => void) {
  const query = matchMedia(REDUCE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

const wantsMotion = () => !matchMedia(REDUCE).matches
// The server renders the first line, still.
const serverMotion = () => false

/**
 * The hero headline: types each line, holds it with a blinking cursor,
 * deletes it and types the next. Screen readers get the first line only, and
 * visitors who prefer reduced motion see the first line, still.
 */
export function TypedHeadline({ className }: { className?: string }) {
  const [line, setLine] = useState(0)
  const [chars, setChars] = useState(HEADLINES[0].length)
  const [phase, setPhase] = useState<Phase>("hold")
  const animate = useSyncExternalStore(
    subscribeMotion,
    wantsMotion,
    serverMotion
  )

  useEffect(() => {
    if (!animate) return
    const text = HEADLINES[line]
    let delay: number
    let next: () => void
    if (phase === "hold") {
      delay = HOLD_MS
      next = () => setPhase("delete")
    } else if (phase === "delete") {
      if (chars > 0) {
        delay = DELETE_MS
        next = () => setChars(chars - 1)
      } else {
        delay = GAP_MS
        next = () => {
          setLine((line + 1) % HEADLINES.length)
          setPhase("type")
        }
      }
    } else if (chars < text.length) {
      delay = text[chars - 1] === "." ? FULL_STOP_MS : TYPE_MS
      next = () => setChars(chars + 1)
    } else {
      delay = 0
      next = () => setPhase("hold")
    }
    const timer = setTimeout(next, delay)
    return () => clearTimeout(timer)
  }, [animate, line, chars, phase])

  return (
    <h1 className={className}>
      <span className="sr-only">{HEADLINES[0]}</span>
      <span aria-hidden="true" className="grid">
        {/* Every line, invisible, in one cell: the headline keeps the
            height of the longest so the page below never moves. */}
        {HEADLINES.map((text) => (
          <span key={text} className="invisible [grid-area:1/1]">
            {text}
            <Cursor />
          </span>
        ))}
        <span className="[grid-area:1/1]">
          {HEADLINES[line].slice(0, chars)}
          <Cursor blink={phase === "hold"} />
        </span>
      </span>
    </h1>
  )
}

function Cursor({ blink = false }: { blink?: boolean }) {
  return (
    <span
      className={cn(
        "ml-[0.06em] inline-block h-[0.82em] w-[0.46em] bg-primary align-[-0.04em]",
        blink && "motion-safe:animate-blink"
      )}
    />
  )
}
