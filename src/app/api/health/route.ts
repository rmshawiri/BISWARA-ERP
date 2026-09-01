import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Endpoint de santé (monitoring Vercel / uptime).
 * Vérifie la connexion à la base de données.
 */
export async function GET() {
  try {
    await db().select({ id: organizations.id }).from(organizations).limit(1);
    return NextResponse.json({ status: "ok", uptime: process.uptime(), time: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ status: "error", message: e instanceof Error ? e.message : "Erreur" }, { status: 503 });
  }
}
