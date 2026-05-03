/**
 * Photo/Video Sync Sheet Router
 * Handles all CRUD operations for shoots, master settings, operator cards,
 * presets, and change log — backed by Supabase (frgdgcpmrshimyxsamdr).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";

// ── Supabase client ──────────────────────────────────────────────────────────
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://frgdgcpmrshimyxsamdr.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function sbFetch(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Supabase error (${res.status}): ${body}`,
    });
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Zod schemas ──────────────────────────────────────────────────────────────

const CameraSettingsSchema = z.object({
  // Photo
  photo_iso: z.string().optional(),
  photo_aperture: z.string().optional(),
  photo_shutter_speed: z.string().optional(),
  photo_white_balance: z.string().optional(),
  photo_color_profile: z.string().optional(),
  photo_focus_mode: z.string().optional(),
  photo_metering_mode: z.string().optional(),
  photo_lens: z.string().optional(),
  photo_file_format: z.string().optional(),
  // Video
  video_resolution: z.string().optional(),
  video_frame_rate: z.string().optional(),
  video_shutter_angle: z.string().optional(),
  video_shutter_speed: z.string().optional(),
  video_iso: z.string().optional(),
  video_aperture: z.string().optional(),
  video_white_balance: z.string().optional(),
  video_color_profile: z.string().optional(),
  video_lut_reference: z.string().optional(),
  video_codec: z.string().optional(),
  video_bit_depth: z.string().optional(),
  video_bitrate: z.string().optional(),
  video_nd_filter: z.string().optional(),
  video_stabilization: z.string().optional(),
  video_timecode_sync: z.string().optional(),
  video_audio_sample_rate: z.string().optional(),
  video_audio_bit_depth: z.string().optional(),
});

// ── Sync status calculator ───────────────────────────────────────────────────

function calcSyncStatus(
  master: Record<string, string | null>,
  operator: Record<string, string | null>,
  captureMode: string
): "synced" | "partial" | "diverged" {
  const photoFields = [
    "photo_iso", "photo_aperture", "photo_shutter_speed",
    "photo_white_balance", "photo_color_profile",
  ];
  const videoFields = [
    "video_resolution", "video_frame_rate", "video_shutter_angle",
    "video_iso", "video_aperture", "video_white_balance",
    "video_color_profile",
  ];

  const fields =
    captureMode === "photo"
      ? photoFields
      : captureMode === "video"
      ? videoFields
      : [...photoFields, ...videoFields];

  const relevantFields = fields.filter(
    (f) => master[f] !== null && master[f] !== undefined && master[f] !== ""
  );
  if (relevantFields.length === 0) return "partial";

  const matches = relevantFields.filter((f) => master[f] === operator[f]);
  const ratio = matches.length / relevantFields.length;

  if (ratio === 1) return "synced";
  if (ratio >= 0.5) return "partial";
  return "diverged";
}

// ── Router ───────────────────────────────────────────────────────────────────

export const syncSheetRouter = router({
  // ── Shoots ──────────────────────────────────────────────────────────────

  getShoots: publicProcedure
    .input(z.object({ includeArchived: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const archived = input?.includeArchived ? "" : "&is_archived=eq.false";
      const data = await sbFetch(
        `photo_video_sync_shoots?select=*&order=created_at.desc${archived}`
      );
      return data as Record<string, unknown>[];
    }),

  getShoot: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const data = (await sbFetch(
        `photo_video_sync_shoots?id=eq.${input.id}&select=*`
      )) as Record<string, unknown>[];
      if (!data || data.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shoot not found" });
      }
      return data[0];
    }),

  createShoot: publicProcedure
    .input(
      z.object({
        password: z.string(),
        project_name: z.string().min(1),
        shoot_id: z.string().min(1),
        date: z.string().optional(),
        location: z.string().optional(),
        lighting_condition: z.string().optional(),
        creative_intent: z.string().optional(),
        lead_dp: z.string().optional(),
        capture_mode: z.enum(["photo", "video", "hybrid"]).default("hybrid"),
        notes: z.string().optional(),
        created_by: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { password, ...payload } = input;
      if (password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }
      const data = await sbFetch("photo_video_sync_shoots", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return (data as Record<string, unknown>[])[0];
    }),

  updateShoot: publicProcedure
    .input(
      z.object({
        password: z.string(),
        id: z.string(),
        project_name: z.string().optional(),
        shoot_id: z.string().optional(),
        date: z.string().optional(),
        location: z.string().optional(),
        lighting_condition: z.string().optional(),
        creative_intent: z.string().optional(),
        lead_dp: z.string().optional(),
        capture_mode: z.enum(["photo", "video", "hybrid"]).optional(),
        notes: z.string().optional(),
        is_locked: z.boolean().optional(),
        is_archived: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { password, id, ...payload } = input;
      if (password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }
      const data = await sbFetch(
        `photo_video_sync_shoots?id=eq.${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
        }
      );
      return (data as Record<string, unknown>[])[0];
    }),

  deleteShoot: publicProcedure
    .input(z.object({ password: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      if (input.password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }
      await sbFetch(`photo_video_sync_shoots?id=eq.${input.id}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      return { success: true };
    }),

  // ── Master Settings ──────────────────────────────────────────────────────

  getMasterSettings: publicProcedure
    .input(z.object({ shoot_id: z.string() }))
    .query(async ({ input }) => {
      const data = (await sbFetch(
        `photo_video_sync_master_settings?shoot_id=eq.${input.shoot_id}&select=*`
      )) as Record<string, unknown>[];
      return data?.[0] || null;
    }),

  upsertMasterSettings: publicProcedure
    .input(
      z.object({
        password: z.string(),
        shoot_id: z.string(),
        updated_by: z.string().optional(),
      }).merge(CameraSettingsSchema)
    )
    .mutation(async ({ input }) => {
      const { password, ...payload } = input;
      if (password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }

      // Check if exists
      const existing = (await sbFetch(
        `photo_video_sync_master_settings?shoot_id=eq.${payload.shoot_id}&select=id`
      )) as Record<string, unknown>[];

      let result;
      if (existing && existing.length > 0) {
        result = await sbFetch(
          `photo_video_sync_master_settings?shoot_id=eq.${payload.shoot_id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
          }
        );
      } else {
        result = await sbFetch("photo_video_sync_master_settings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      // Auto-recalculate sync status for all operator cards
      const cards = (await sbFetch(
        `photo_video_sync_operator_cards?shoot_id=eq.${payload.shoot_id}&select=*`
      )) as Record<string, string | null>[];

      if (cards && cards.length > 0) {
        const shootData = (await sbFetch(
          `photo_video_sync_shoots?id=eq.${payload.shoot_id}&select=capture_mode`
        )) as Record<string, string>[];
        const captureMode = shootData?.[0]?.capture_mode || "hybrid";

        for (const card of cards) {
          const syncStatus = calcSyncStatus(
            payload as Record<string, string | null>,
            card,
            captureMode
          );
          await sbFetch(
            `photo_video_sync_operator_cards?id=eq.${card.id}`,
            {
              method: "PATCH",
              body: JSON.stringify({ sync_status: syncStatus, updated_at: new Date().toISOString() }),
              headers: { Prefer: "return=minimal" },
            }
          );
        }
      }

      return (result as Record<string, unknown>[])?.[0] || result;
    }),

  // ── Operator Cards ───────────────────────────────────────────────────────

  getOperatorCards: publicProcedure
    .input(z.object({ shoot_id: z.string() }))
    .query(async ({ input }) => {
      const data = await sbFetch(
        `photo_video_sync_operator_cards?shoot_id=eq.${input.shoot_id}&select=*&order=created_at.asc`
      );
      return data as Record<string, unknown>[];
    }),

  createOperatorCard: publicProcedure
    .input(
      z.object({
        password: z.string(),
        shoot_id: z.string(),
        operator_name: z.string().min(1),
        role: z.string().default("A Cam"),
        camera_body: z.string().optional(),
        lens: z.string().optional(),
        operator_notes: z.string().optional(),
        last_updated_by: z.string().optional(),
      }).merge(CameraSettingsSchema)
    )
    .mutation(async ({ input }) => {
      const { password, ...payload } = input;
      if (password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }

      // Get master settings and shoot for sync calc
      const master = (await sbFetch(
        `photo_video_sync_master_settings?shoot_id=eq.${payload.shoot_id}&select=*`
      )) as Record<string, string | null>[];
      const shootData = (await sbFetch(
        `photo_video_sync_shoots?id=eq.${payload.shoot_id}&select=capture_mode`
      )) as Record<string, string>[];
      const captureMode = shootData?.[0]?.capture_mode || "hybrid";

      const syncStatus =
        master && master.length > 0
          ? calcSyncStatus(master[0], payload as Record<string, string | null>, captureMode)
          : "partial";

      const data = await sbFetch("photo_video_sync_operator_cards", {
        method: "POST",
        body: JSON.stringify({ ...payload, sync_status: syncStatus }),
      });
      return (data as Record<string, unknown>[])[0];
    }),

  updateOperatorCard: publicProcedure
    .input(
      z.object({
        password: z.string(),
        id: z.string(),
        shoot_id: z.string(),
        operator_name: z.string().optional(),
        role: z.string().optional(),
        camera_body: z.string().optional(),
        lens: z.string().optional(),
        operator_notes: z.string().optional(),
        deviation_reason: z.string().optional(),
        deviation_explanation: z.string().optional(),
        is_intentional_deviation: z.boolean().optional(),
        last_updated_by: z.string().optional(),
      }).merge(CameraSettingsSchema)
    )
    .mutation(async ({ input }) => {
      const { password, id, shoot_id, ...payload } = input;
      if (password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }

      // Recalculate sync status
      const master = (await sbFetch(
        `photo_video_sync_master_settings?shoot_id=eq.${shoot_id}&select=*`
      )) as Record<string, string | null>[];
      const shootData = (await sbFetch(
        `photo_video_sync_shoots?id=eq.${shoot_id}&select=capture_mode`
      )) as Record<string, string>[];
      const captureMode = shootData?.[0]?.capture_mode || "hybrid";

      const syncStatus =
        master && master.length > 0 && !payload.is_intentional_deviation
          ? calcSyncStatus(master[0], payload as Record<string, string | null>, captureMode)
          : payload.is_intentional_deviation
          ? "partial"
          : "partial";

      const data = await sbFetch(
        `photo_video_sync_operator_cards?id=eq.${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...payload,
            sync_status: syncStatus,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      return (data as Record<string, unknown>[])[0];
    }),

  syncOperatorFromMaster: publicProcedure
    .input(
      z.object({
        password: z.string(),
        operator_card_id: z.string(),
        shoot_id: z.string(),
        synced_by: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }

      const master = (await sbFetch(
        `photo_video_sync_master_settings?shoot_id=eq.${input.shoot_id}&select=*`
      )) as Record<string, string | null>[];
      if (!master || master.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Master settings not found" });
      }

      const masterSettings = { ...master[0] };
      delete masterSettings.id;
      delete masterSettings.shoot_id;
      delete masterSettings.created_at;
      delete masterSettings.updated_at;
      delete masterSettings.updated_by;

      const data = await sbFetch(
        `photo_video_sync_operator_cards?id=eq.${input.operator_card_id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...masterSettings,
            sync_status: "synced",
            is_intentional_deviation: false,
            deviation_reason: null,
            deviation_explanation: null,
            last_updated_by: input.synced_by || null,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      // Log the sync
      await sbFetch("photo_video_sync_change_log", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          shoot_id: input.shoot_id,
          operator_card_id: input.operator_card_id,
          changed_by: input.synced_by || "system",
          field_changed: "all_settings",
          old_value: "operator_values",
          new_value: "master_values",
          context: "full_sync_from_master",
        }),
      });

      return (data as Record<string, unknown>[])[0];
    }),

  deleteOperatorCard: publicProcedure
    .input(z.object({ password: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      if (input.password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }
      await sbFetch(`photo_video_sync_operator_cards?id=eq.${input.id}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      return { success: true };
    }),

  // ── Presets ──────────────────────────────────────────────────────────────

  getPresets: publicProcedure
    .input(z.object({ capture_mode: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const filter =
        input?.capture_mode && input.capture_mode !== "all"
          ? `&or=(capture_mode.eq.${input.capture_mode},capture_mode.eq.hybrid)`
          : "";
      const data = await sbFetch(
        `photo_video_sync_presets?select=*&order=is_builtin.desc,name.asc${filter}`
      );
      return data as Record<string, unknown>[];
    }),

  createPreset: publicProcedure
    .input(
      z.object({
        password: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        capture_mode: z.enum(["photo", "video", "hybrid"]).default("hybrid"),
        settings: z.record(z.string(), z.string()),
        created_by: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { password, ...payload } = input;
      if (password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }
      const data = await sbFetch("photo_video_sync_presets", {
        method: "POST",
        body: JSON.stringify({ ...payload, is_builtin: false }),
      });
      return (data as Record<string, unknown>[])[0];
    }),

  deletePreset: publicProcedure
    .input(z.object({ password: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      if (input.password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }
      // Don't allow deleting built-in presets
      const preset = (await sbFetch(
        `photo_video_sync_presets?id=eq.${input.id}&select=is_builtin`
      )) as Record<string, boolean>[];
      if (preset?.[0]?.is_builtin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete built-in presets" });
      }
      await sbFetch(`photo_video_sync_presets?id=eq.${input.id}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      return { success: true };
    }),

  applyPresetToMaster: publicProcedure
    .input(
      z.object({
        password: z.string(),
        preset_id: z.string(),
        shoot_id: z.string(),
        applied_by: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.password !== "&&77VAnguard") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }

      const presets = (await sbFetch(
        `photo_video_sync_presets?id=eq.${input.preset_id}&select=*`
      )) as Record<string, unknown>[];
      if (!presets || presets.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preset not found" });
      }

      const settings = presets[0].settings as Record<string, string>;

      // Upsert master settings with preset values
      const existing = (await sbFetch(
        `photo_video_sync_master_settings?shoot_id=eq.${input.shoot_id}&select=id`
      )) as Record<string, unknown>[];

      let result;
      const payload = {
        ...settings,
        shoot_id: input.shoot_id,
        updated_by: input.applied_by || null,
        updated_at: new Date().toISOString(),
      };

      if (existing && existing.length > 0) {
        result = await sbFetch(
          `photo_video_sync_master_settings?shoot_id=eq.${input.shoot_id}`,
          { method: "PATCH", body: JSON.stringify(payload) }
        );
      } else {
        result = await sbFetch("photo_video_sync_master_settings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      // Log preset application
      await sbFetch("photo_video_sync_change_log", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          shoot_id: input.shoot_id,
          changed_by: input.applied_by || "system",
          field_changed: "master_settings",
          new_value: `preset:${presets[0].name}`,
          context: "preset_applied",
        }),
      });

      return (result as Record<string, unknown>[])?.[0] || result;
    }),

  // ── Change Log ───────────────────────────────────────────────────────────

  getChangeLog: publicProcedure
    .input(
      z.object({
        shoot_id: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const data = await sbFetch(
        `photo_video_sync_change_log?shoot_id=eq.${input.shoot_id}&select=*&order=created_at.desc&limit=${input.limit}`
      );
      return data as Record<string, unknown>[];
    }),

  logChange: publicProcedure
    .input(
      z.object({
        shoot_id: z.string(),
        operator_card_id: z.string().optional(),
        changed_by: z.string(),
        field_changed: z.string(),
        old_value: z.string().optional(),
        new_value: z.string().optional(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await sbFetch("photo_video_sync_change_log", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(input),
      });
      return { success: true };
    }),
});
