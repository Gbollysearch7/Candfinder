import { exaProxy } from "@/lib/exa-client";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ websetId: string; itemId: string }> }
) {
  const { websetId, itemId } = await params;
  return exaProxy(req, `/websets/${websetId}/items/${itemId}`);
}
