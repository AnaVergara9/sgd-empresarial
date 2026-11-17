import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Empresa API activa" });
}

export async function POST(request: Request) {
  return NextResponse.json({ message: "Crear empresa endpoint" });
}