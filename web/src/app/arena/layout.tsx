import { ArenaProvider } from "@/components/arena/ArenaProvider";

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return <ArenaProvider>{children}</ArenaProvider>;
}
