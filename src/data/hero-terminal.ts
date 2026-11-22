// The text in the hero's mock Brindle window. Each line is a list of
// segments; `c` is a Tailwind text-colour class from the terminal tokens.
// TODO: generate from Brindle's `--dump-screen-after` output instead of by hand.

export interface Segment {
  t: string
  c?: string
  bold?: boolean
}

export interface Line {
  segs: Segment[]
  /** The shell reported a non-zero exit: Brindle draws a red bar by the prompt. */
  failed?: boolean
  cursor?: boolean
}

const blue = "text-terminal-ansi-4"
const red = "text-terminal-ansi-1"
const green = "text-terminal-ansi-2"
const magenta = "text-terminal-ansi-5"
const cyan = "text-terminal-ansi-6"

const prompt = (cmd: string): Segment[] => [
  { t: "~/src/brindle", c: blue },
  { t: " main", c: magenta },
  { t: " $ " },
  { t: cmd },
]

export const leftZone: Line[] = [
  { segs: prompt("git status --short") },
  { segs: [{ t: " M", c: red }, { t: " src/zones.rs" }] },
  { segs: [{ t: "??", c: red }, { t: " notes.md" }] },
  { segs: prompt("cargo test -q zones") },
  { segs: [{ t: "running 48 tests" }] },
  {
    segs: [{ t: "................................................", c: green }],
  },
  {
    segs: [
      { t: "test result: " },
      { t: "ok", c: green },
      { t: ". 48 passed; 0 failed; finished in 0.41s" },
    ],
  },
  { segs: prompt("cargo clippy -q -- -D warnings"), failed: true },
  {
    segs: [
      { t: "error", c: red, bold: true },
      { t: ": unused variable: `rect`", bold: true },
    ],
  },
  { segs: [{ t: "   --> ", c: blue }, { t: "src/zones.rs:212:9" }] },
  { segs: [{ t: "    |", c: blue }] },
  { segs: [{ t: "212 |", c: blue }, { t: "     let rect = zone.bounds();" }] },
  {
    segs: [
      { t: "    |", c: blue },
      { t: "         ^^^^ ", c: red },
      { t: "help: prefix it with an underscore: `_rect`", c: cyan },
    ],
  },
  { segs: [{ t: " " }] },
  { segs: prompt(""), cursor: true },
]

export const rightZone: Line[] = [
  { segs: prompt("cargo watch -q -x 'test -q'") },
  { segs: [{ t: "[Running 'cargo test -q']", c: cyan }] },
  { segs: [{ t: "running 212 tests" }] },
  { segs: [{ t: "........................................", c: green }] },
  {
    segs: [
      { t: "test result: " },
      { t: "ok", c: green },
      { t: ". 212 passed; 0 failed" },
    ],
  },
  { segs: [{ t: "[Finished running. Exit status: 0]", c: cyan }] },
]
