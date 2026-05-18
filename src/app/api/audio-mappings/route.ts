import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// PATCH /api/audio-mappings
// Body: { sceneId, freesoundId, name, previewUrl, duration, license, query }
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { sceneId, freesoundId, name, previewUrl, duration, license, query } =
    body ?? {};

  if (!sceneId || !freesoundId || !name || !previewUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("audio_mappings")
    .upsert(
      {
        scene_id: sceneId,
        freesound_id: Number(freesoundId),
        name,
        preview_url: previewUrl,
        duration: Number(duration ?? 0),
        license: license ?? "",
        query: query ?? "",
        is_manual: true,
      },
      { onConflict: "scene_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mapping: data });
}

// DELETE /api/audio-mappings?sceneId=<id>
export async function DELETE(req: NextRequest) {
  const sceneId = req.nextUrl.searchParams.get("sceneId");
  if (!sceneId) {
    return NextResponse.json({ error: "sceneId is required" }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db
    .from("audio_mappings")
    .delete()
    .eq("scene_id", sceneId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
