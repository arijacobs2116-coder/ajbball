import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  action: "upsert_dates" | "clear_range" | "clear_date";
  passcode: string;
  dates?: string[];
  date?: string;
  startDate?: string;
  endDate?: string;
  session?: {
    start: string;
    end: string;
    label: string;
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as RequestBody;
    const expectedPasscode = Deno.env.get("ADMIN_PASSCODE");

    if (!expectedPasscode || body.passcode !== expectedPasscode) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (body.action === "upsert_dates") {
      const rows =
        body.dates?.map((date) => ({
          session_date: date,
          start_time: body.session?.start,
          end_time: body.session?.end,
          label: body.session?.label,
        })) ?? [];

      const { error } = await supabase
        .from("availability_slots")
        .upsert(rows, { onConflict: "session_date,start_time,end_time" });

      if (error) {
        throw error;
      }
    }

    if (body.action === "clear_range") {
      const { error } = await supabase
        .from("availability_slots")
        .delete()
        .gte("session_date", body.startDate ?? "")
        .lte("session_date", body.endDate ?? "");

      if (error) {
        throw error;
      }
    }

    if (body.action === "clear_date") {
      const { error } = await supabase
        .from("availability_slots")
        .delete()
        .eq("session_date", body.date ?? "");

      if (error) {
        throw error;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
