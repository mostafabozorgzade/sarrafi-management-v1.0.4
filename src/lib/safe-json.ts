import { NextResponse } from "next/server";

function serialize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serialize);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serialize(value);
    }
    return result;
  }
  return obj;
}

export function safeJson(data: unknown, init?: ResponseInit) {
  const serialized = serialize(data);
  return NextResponse.json(serialized, init);
}
