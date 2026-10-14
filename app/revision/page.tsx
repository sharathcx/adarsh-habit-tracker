import { RevisionView } from "@/components/revision-view";
import { getAppState } from "@/lib/state-service";

export const dynamic = "force-dynamic";

export default async function RevisionPage() {
  const state = await getAppState();
  return <RevisionView state={state} />;
}
