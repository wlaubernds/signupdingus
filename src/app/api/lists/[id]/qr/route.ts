import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // RLS: only the list owner can read the row, so this doubles as auth.
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("signup_lists")
    .select("slug, title")
    .eq("id", id)
    .single();
  if (!list) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const publicUrl = `${getSiteUrl()}/s/${list.slug}`;
  const png = await QRCode.toBuffer(publicUrl, {
    type: "png",
    width: 640,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  const { searchParams } = new URL(request.url);
  const download = searchParams.has("download");
  const filename = `${list.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.png`;

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=60",
      ...(download
        ? { "Content-Disposition": `attachment; filename="${filename}"` }
        : {}),
    },
  });
}
