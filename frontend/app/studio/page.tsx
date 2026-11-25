import { VellumStudioWorkspace } from "@/components/studio/VellumStudioWorkspace";

export const dynamic = "force-dynamic";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const { tool } = await searchParams;
  return <VellumStudioWorkspace initialTool={tool} />;
}
