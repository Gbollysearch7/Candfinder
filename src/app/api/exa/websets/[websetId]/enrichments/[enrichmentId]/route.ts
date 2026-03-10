import { exaProxy } from "@/lib/exa-client";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ websetId: string; enrichmentId: string }> }
) {
  const { websetId, enrichmentId } = await params;
  return exaProxy(req, `/websets/${websetId}/enrichments/${enrichmentId}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ websetId: string; enrichmentId: string }> }
) {
  const { websetId, enrichmentId } = await params;
  return exaProxy(req, `/websets/${websetId}/enrichments/${enrichmentId}`, {
    method: "DELETE",
  });
}
