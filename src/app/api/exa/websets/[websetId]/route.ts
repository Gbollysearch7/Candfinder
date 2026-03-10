import { exaProxy } from "@/lib/exa-client";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ websetId: string }> }
) {
  const { websetId } = await params;
  return exaProxy(req, `/websets/${websetId}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ websetId: string }> }
) {
  const { websetId } = await params;
  return exaProxy(req, `/websets/${websetId}`, { method: "DELETE" });
}
