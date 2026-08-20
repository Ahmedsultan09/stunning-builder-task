"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const briefIdSchema = z.coerce.number().int().positive();

export async function deleteBrief(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/login?next=/history");

  const briefId = briefIdSchema.parse(formData.get("briefId"));
  const supabase = await createClient();
  const { error } = await supabase.from("briefs").delete().eq("id", briefId);

  if (error) throw new Error("The saved brief could not be deleted.");

  revalidatePath("/history");
}
