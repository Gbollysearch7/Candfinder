import { exaProxy } from "@/lib/exa-client";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ websetId: string; enrichmentId: string }> }
) {
  const { websetId, enrichmentId } = await params;
  return exaProxy(
    req,
    `/websets/${websetId}/enrichments/${enrichmentId}/cancel`,
    { method: "POST" }
  );
}
