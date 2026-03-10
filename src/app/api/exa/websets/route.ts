import { exaProxy } from "@/lib/exa-client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return exaProxy(req, "/websets");
}

export async function POST(req: NextRequest) {
  return exaProxy(req, "/websets", { method: "POST" });
}
