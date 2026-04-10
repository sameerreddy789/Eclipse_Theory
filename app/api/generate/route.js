import { NextResponse } from "next/server";

// This route now only validates input and returns the structured prompt data.
// Actual Gemini calls happen client-side to avoid Vercel's 60s timeout.

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { courseName, depth, modules } = body;

    if (!courseName || typeof courseName !== "string") {
      return NextResponse.json({ error: "courseName is required" }, { status: 400 });
    }
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json({ error: "At least one module with topics is required" }, { status: 400 });
    }

    const cleanModules = modules
      .map((m) => ({
        name: (m.name || "").trim(),
        topics: (m.topics || []).filter((t) => t && t.trim()).map((t) => t.trim()),
      }))
      .filter((m) => m.name && m.topics.length > 0);

    if (!cleanModules.length) {
      return NextResponse.json({ error: "No valid modules with topics found" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      data: {
        courseName: courseName.trim(),
        depth: depth === "brief" ? "brief" : "detailed",
        modules: cleanModules,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
