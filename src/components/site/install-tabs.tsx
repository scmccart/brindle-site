import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { release } from "@/data/release"

function Code({ label, lines }: { label: string; lines: readonly string[] }) {
  return (
    <figure className="mt-6">
      <figcaption className="sr-only">{label}</figcaption>
      <pre
        tabIndex={0}
        className="overflow-x-auto rounded-xl border border-border bg-terminal-background px-6 py-5 font-mono text-sm leading-7 text-terminal-foreground"
      >
        {lines.join("\n")}
      </pre>
    </figure>
  )
}

function Mono({ children }: { children: string }) {
  return <code className="font-mono text-[0.9em]">{children}</code>
}

export function InstallTabs() {
  return (
    <Tabs defaultValue="linux" className="gap-8">
      <TabsList className="h-11! w-fit">
        <TabsTrigger value="linux" className="px-5 text-[15px]">
          Linux
        </TabsTrigger>
        <TabsTrigger value="windows" className="px-5 text-[15px]">
          Windows
        </TabsTrigger>
      </TabsList>
      <TabsContent value="linux" className="text-base">
        <p className="max-w-[62ch] text-lg leading-relaxed">
          Download the archive and <Mono>SHA256SUMS</Mono> from the release,
          then check, unpack and install. Keep{" "}
          <Mono>brindle-remote-linux-x86_64</Mono> beside <Mono>brindle</Mono>:
          local and remote tabs both need it.
        </p>
        <Code label="Linux install commands" lines={release.linux.install} />
        <p className="mt-5 max-w-[62ch] leading-relaxed">
          Built on {release.linux.glibcFrom}, so it needs a glibc at least that
          new. To update, install the new release&apos;s files the same way.
        </p>
      </TabsContent>
      <TabsContent value="windows" className="text-base">
        <p className="max-w-[62ch] text-lg leading-relaxed">
          Unpack the zip anywhere, keep <Mono>brindle.exe</Mono> and{" "}
          <Mono>brindle-remote.exe</Mono> together, and run{" "}
          <Mono>brindle.exe</Mono>. Needs {release.windows.minimum}.
        </p>
        <Code
          label="Windows install commands"
          lines={release.windows.install}
        />
      </TabsContent>
    </Tabs>
  )
}
