import { NextResponse } from "next/server";
import { getStock } from "@/lib/inventory";

export async function GET() {
  const stock = await getStock();
  return NextResponse.json(stock);
}
