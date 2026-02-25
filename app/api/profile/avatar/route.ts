import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/config/auth";
import { db } from "@/config/db";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/config/supabase";

const BUCKET = "user-avatars";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json(
        { error: "Avatar upload is not configured on the server." },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Avatar file is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use PNG, JPG, or WEBP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Avatar must be 5MB or smaller." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const path = `${session.user.id}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    // Create bucket on first use if missing, then retry once.
    if (uploadError && /bucket not found/i.test(uploadError.message)) {
      const { error: createBucketError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: `${MAX_SIZE}`,
      });

      if (createBucketError) {
        console.error("Avatar bucket creation error:", createBucketError);
      } else {
        const retry = await supabase.storage.from(BUCKET).upload(path, buffer, {
          contentType: file.type,
          upsert: true,
        });
        uploadError = retry.error;
      }
    }

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload avatar." }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { image: data.publicUrl },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Avatar update error:", error);
    return NextResponse.json(
      { error: "Failed to update avatar. Please try again." },
      { status: 500 },
    );
  }
}
