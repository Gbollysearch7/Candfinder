import { exaProxy } from "@/lib/exa-client";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ websetId: string }> }
) {
  const { websetId } = await params;
  return exaProxy(req, `/websets/${websetId}/cancel`, { method: "POST" });
}
