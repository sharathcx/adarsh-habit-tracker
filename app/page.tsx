import { HomeView } from "@/components/home-view";
import { getAppState } from "@/lib/state-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await getAppState();
  return <HomeView state={state} />;
}
