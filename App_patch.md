# App.tsx — patch instructions
# Apply these 5 changes in order (top → bottom so line numbers stay valid)

# ── 1. ADD at the very top of the file (before any existing code) ─────────────
# Insert after line 1 (`import { useState, useEffect, useRef } from "react";`):

import { C, SERIF, SANS, AppLogo, useGetData, useSaveData } from "./shared";
import CreatorPage from "./CreatorPage";


# ── 2. REMOVE lines 5–27 (useGetData + useSaveData hooks) ────────────────────
# Delete this entire block:

function useGetData() {
  ...
}
function useSaveData() {
  ...
}


# ── 3. REMOVE lines 30–37 (C, SERIF, SANS constants) ─────────────────────────
# Delete this entire block:

const C = { ... };
const SERIF = ...;
const SANS  = ...;


# ── 4. REMOVE lines 913–922 (AppLogo function) ────────────────────────────────
# Delete:

function AppLogo({size="nav"}: {size?: "nav"|"auth"|"web"}) {
  ...
}


# ── 5. REMOVE lines 3622–3650 (CreatorPage function) ──────────────────────────
# Delete:

// ─── CREATOR PAGE (placeholder) ───────────────────────────
function CreatorPage({settings,logout}: ...) {
  ...
}


# ── RESULT ────────────────────────────────────────────────────────────────────
# App.tsx stays identical in behaviour.
# C / SERIF / SANS / AppLogo / useGetData / useSaveData now live in shared.ts
# CreatorPage now lives in CreatorPage.tsx
# Both files import from shared.ts — no logic duplicated, no data duplication.
