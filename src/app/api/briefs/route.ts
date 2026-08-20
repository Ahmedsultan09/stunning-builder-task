import { ZodError } from "zod";

import { saveBriefSchema } from "@/lib/save-brief-schema";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type SaveErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHENTICATED"
  | "CONFIGURATION_ERROR"
  | "DATABASE_ERROR";

function errorResponse(status: number, code: SaveErrorCode, message: string) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function parseRequest(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ZodError([
      {
        code: "custom",
        message: "Request body must be valid JSON.",
        path: [],
      },
    ]);
  }

  return saveBriefSchema.parse(body);
}

export async function POST(request: Request) {
  try {
    const payload = await parseRequest(request);

    if (!isSupabaseConfigured()) {
      return errorResponse(
        503,
        "CONFIGURATION_ERROR",
        "Brief history is not configured for this environment.",
      );
    }

    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || typeof claimsData?.claims?.sub !== "string") {
      return errorResponse(
        401,
        "UNAUTHENTICATED",
        "Sign in to save this brief.",
      );
    }

    const { data, error } = await supabase.rpc("save_brief", {
      p_client_request_id: payload.requestId,
      p_prompt: payload.prompt,
      p_output: payload.output,
      p_integration_ids: payload.integrations,
    });
    const savedBrief = data?.[0];

    if (error || !savedBrief) {
      return errorResponse(
        503,
        "DATABASE_ERROR",
        "The brief was generated but could not be saved. Please retry.",
      );
    }

    return Response.json(
      { id: savedBrief.id, createdAt: savedBrief.created_at },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "INVALID_REQUEST",
        error.issues[0]?.message ?? "Invalid request.",
      );
    }

    return errorResponse(
      503,
      "DATABASE_ERROR",
      "The brief was generated but could not be saved. Please retry.",
    );
  }
}
