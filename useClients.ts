import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ─── TYPES ────────────────────────────────────────────────

export type Client = {
  id:         string;
  name:       string;
  contact:    string;
  email:      string;
  agency:     "Direct" | "Agency";
  country:    string;
  tags:       string[];
  notes:      string;
  created_at: string;
};

export type ClientSaveResult = { ok: boolean; message: string; id?: string };

// ─── NORMALISE ────────────────────────────────────────────

function normalise(raw: any): Client {
  return {
    id:         raw.id,
    name:       raw.name       ?? "",
    contact:    raw.contact    ?? "",
    email:      raw.email      ?? "",
    agency:     raw.agency     ?? "Direct",
    country:    raw.country    ?? "Germany",
    tags:       Array.isArray(raw.tags) ? raw.tags : [],
    notes:      raw.notes      ?? "",
    created_at: raw.created_at ?? new Date().toISOString(),
  };
}

// ─── MATCH OR CREATE CLIENT ───────────────────────────────
// Shared function — called after every project save (Calculator + AddProjectModal).
// 1. Look up clients by brand name (case-insensitive).
// 2. If found → return existing id.
// 3. If not found → INSERT new client row → return new id.
// 4. UPDATE projects.client_id = returned id.
//
// Safe to call multiple times for the same brand — will never create duplicates.

export async function matchOrCreateClient(
  brand:     string,
  contact:   string,
  projectId: string
): Promise<{ ok: boolean; clientId?: string }> {
  if (!brand.trim()) return { ok: false };

  // 1. Look for existing client
  const { data: existing, error: lookupErr } = await supabase
    .from("clients")
    .select("id")
    .ilike("name", brand.trim())
    .limit(1)
    .maybeSingle();

  if (lookupErr) return { ok: false };

  let clientId: string;

  if (existing) {
    clientId = existing.id;
  } else {
    // 2. Create new client
    const { data: created, error: insertErr } = await supabase
      .from("clients")
      .insert({ name: brand.trim(), contact: contact.trim() })
      .select("id")
      .single();
    if (insertErr || !created) return { ok: false };
    clientId = created.id;
  }

  // 3. Link project → client
  const { error: updateErr } = await supabase
    .from("projects")
    .update({ client_id: clientId })
    .eq("id", projectId);

  if (updateErr) return { ok: false };
  return { ok: true, clientId };
}

// ─── HOOK ─────────────────────────────────────────────────

export function useClients() {
  const [loaded,  setLoaded]  = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Initial load
  useEffect(() => {
    let active = true;
    supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) setClients(data.map(normalise));
        setLoaded(true);
      });

    // Realtime subscription
    const channel = supabase
      .channel("clients_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setClients(prev => [normalise(payload.new), ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setClients(prev => prev.map(c => c.id === payload.new.id ? normalise(payload.new) : c));
        } else if (payload.eventType === "DELETE") {
          setClients(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const saveClient = useCallback(async (client: Partial<Client> & { id?: string }): Promise<ClientSaveResult> => {
    const { id, ...rest } = client;
    if (id) {
      const { error } = await supabase.from("clients").update(rest).eq("id", id);
      if (error) return { ok: false, message: "Could not save client." };
      return { ok: true, message: "Saved." };
    } else {
      const { data, error } = await supabase.from("clients").insert(rest).select("id").single();
      if (error) return { ok: false, message: "Could not create client." };
      return { ok: true, message: "Client created.", id: data?.id };
    }
  }, []);

  const removeClient = useCallback(async (id: string): Promise<ClientSaveResult> => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete client." };
    setClients(prev => prev.filter(c => c.id !== id));
    return { ok: true, message: "Deleted." };
  }, []);

  return { loaded, clients, saveClient, removeClient };
}
