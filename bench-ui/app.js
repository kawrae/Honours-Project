const $ = (id) => document.getElementById(id);

const envMeta = {
  laravel: { label: "Laravel", tabId: "tabLaravel", urlId: "urlLaravel" },
  ci: { label: "CodeIgniter", tabId: "tabCI", urlId: "urlCI" },
  symfony: { label: "Symfony", tabId: "tabSymfony", urlId: "urlSymfony" },
};

const envOrder = ["laravel", "ci", "symfony"];

const state = {
  active: "laravel",
  urls: {
    laravel: "http://laravel-bench.local",
    ci: "http://ci-bench.local",
    symfony: "http://symfony-bench.local",
  },
  lastRun: null, // { path, options, mode } (mode at time of run)
};

function readInputs() {
  for (const env of envOrder) {
    const meta = envMeta[env];
    const el = $(meta.urlId);
    if (!el) continue;
    const v = el.value.trim();
    if (v) state.urls[env] = v;
  }
}

function nextEnv(env) {
  const i = envOrder.indexOf(env);
  return envOrder[(i + 1) % envOrder.length];
}

function baseUrl(env) {
  readInputs();
  return state.urls[env].replace(/\/+$/, "");
}

function setActive(env, { rerun = true } = {}) {
  state.active = env;

  // Tabs selected state
  for (const e of envOrder) {
    const tab = $(envMeta[e].tabId);
    if (tab) tab.setAttribute("aria-selected", e === env ? "true" : "false");
  }

  $("activeEnvPill").textContent = `Active: ${envMeta[env].label}`;

  // Pane titles
  const other = nextEnv(env);
  $("paneActiveTitle").textContent = envMeta[env].label;
  $("paneOtherTitle").textContent = envMeta[other].label;

  // IMPORTANT: clear stale pane data immediately so it never "lies"
  clearPane("active");
  clearPane("other");
  setMeter(null, "idle");

  // If user previously ran something (Load Items etc), re-run against new target(s)
  if (rerun && state.lastRun) {
    run(state.lastRun.path, state.lastRun.options, { record: false });
  }
}

function clearPane(which) {
  if (which === "active") {
    $("outActive").textContent = "";
    $("paneActiveLatency").textContent = "";
  } else {
    $("outOther").textContent = "";
    $("paneOtherLatency").textContent = "";
  }
}

function setMeter(kind, text) {
  // kind: null | "ok" | "err"
  const dot = $("meterDot");
  const t = $("meterText");
  dot.classList.remove("ok", "err");
  if (kind === "ok") dot.classList.add("ok");
  if (kind === "err") dot.classList.add("err");
  t.textContent = text;
}

function fmtMs(ms) {
  if (ms == null) return "";
  return `${Math.round(ms)}ms`;
}

function logLine(env, path, status, ms) {
  const row = document.createElement("div");
  row.className = "log-row";

  const pill = document.createElement("span");
  pill.className = `pill pill-${env}`;
  pill.textContent = env.toUpperCase();

  const p = document.createElement("span");
  p.className = "log-path";
  p.textContent = path;

  const s = document.createElement("span");
  s.className = "log-meta";
  s.textContent = `${status} • ${fmtMs(ms)}`;

  row.appendChild(pill);
  row.appendChild(p);
  row.appendChild(s);

  $("log").prepend(row);
}

async function fetchJson(url, options = {}) {
  const t0 = performance.now();
  try {
    const res = await fetch(url, options);
    const ms = performance.now() - t0;

    // Handle non-JSON (still try to parse)
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return { ok: res.ok, status: res.status, data, ms };
  } catch (e) {
    const ms = performance.now() - t0;
    return { ok: false, status: 0, data: { error: String(e) }, ms };
  }
}

function renderPane(which, env, result) {
  const out = which === "active" ? $("outActive") : $("outOther");
  const badge = which === "active" ? $("paneActiveLatency") : $("paneOtherLatency");
  badge.textContent = fmtMs(result.ms);

  // Render JSON pretty if object/array
  const d = result.data;
  const pretty =
    d && typeof d === "object" ? JSON.stringify(d, null, 2) : String(d ?? "");

  out.textContent = pretty;
}

async function run(path, options = {}, { record = true } = {}) {
  const mode = $("mode").value;

  if (record) {
    // Remember what the user did so tab switching can re-run it
    state.lastRun = { path, options, mode };
  }

  if (mode === "compare") {
    $("paneOther").hidden = false;
    return runCompare(path, options);
  } else {
    $("paneOther").hidden = true;
    return runSingle(path, options);
  }
}

async function runSingle(path, options = {}) {
  const env = state.active;
  const url = baseUrl(env) + path;

  setMeter(null, "running…");
  const result = await fetchJson(url, options);

  logLine(env, path, result.status, result.ms);

  if (!result.ok) {
    setMeter("err", "error");
  } else {
    setMeter("ok", `done • ${fmtMs(result.ms)}`);
  }

  renderPane("active", env, result);
  $("lastLatency").textContent = fmtMs(result.ms);

  return result;
}

async function runCompare(path, options = {}) {
  const a = state.active;
  const b = nextEnv(state.active);

  const urlA = baseUrl(a) + path;
  const urlB = baseUrl(b) + path;

  setMeter(null, "running…");

  // Fire both concurrently
  const [resA, resB] = await Promise.all([fetchJson(urlA, options), fetchJson(urlB, options)]);

  // Log both
  logLine(a, path, resA.status, resA.ms);
  logLine(b, path, resB.status, resB.ms);

  // Meter: ok only if both ok
  if (resA.ok && resB.ok) {
    setMeter("ok", `done • ${fmtMs(Math.max(resA.ms, resB.ms))}`);
  } else {
    setMeter("err", "error");
  }

  // Render into the correct panes (ACTIVE pane is always state.active)
  renderPane("active", a, resA);
  renderPane("other", b, resB);

  $("lastLatency").textContent = `${fmtMs(Math.min(resA.ms, resB.ms))}–${fmtMs(Math.max(resA.ms, resB.ms))}`;

  return { a: resA, b: resB };
}

async function healthChecks() {
  $("pingStatus").textContent = "…";
  $("dbCount").textContent = "…";

  // Ping
  const pingRes = await run("/api/bench/ping");
  if (!pingRes) return;

  // DB Count
  const dbRes = await run("/api/bench/db");
  if (!dbRes) return;

  if (dbRes.data && typeof dbRes.data.count !== "undefined") {
    $("dbCount").textContent = String(dbRes.data.count);
  } else {
    $("dbCount").textContent = "—";
  }

  $("pingStatus").textContent = "ok";
}

async function createItem() {
  const name = $("newName").value.trim() || "Bench Insert";
  const description = $("newDesc").value.trim() || "Insert test";

  const body = JSON.stringify({ name, description });
  await run("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

async function deleteItemOne() {
  await run("/api/items/1", { method: "DELETE" });
}

function bind() {
  // Tabs
  $("tabLaravel").addEventListener("click", () => setActive("laravel"));
  $("tabCI").addEventListener("click", () => setActive("ci"));
  $("tabSymfony").addEventListener("click", () => setActive("symfony"));

  // Swap cycles through envOrder
  $("swapBtn").addEventListener("click", () => setActive(nextEnv(state.active)));

  // Actions
  $("runHealth").addEventListener("click", healthChecks);
  $("clearLog").addEventListener("click", () => ($("log").innerHTML = ""));
  $("loadItems").addEventListener("click", () => run("/api/items"));
  $("loadOne").addEventListener("click", () => run("/api/items/1"));
  $("createItem").addEventListener("click", createItem);
  $("deleteOne").addEventListener("click", deleteItemOne);

  // Mode change should rerun last action (or clear)
  $("mode").addEventListener("change", () => {
    $("paneOther").hidden = $("mode").value !== "compare";
    // Titles might change because "other" env changes with active
    setActive(state.active, { rerun: true });
  });

  // Default UI state
  $("paneOther").hidden = $("mode").value !== "compare";
  setActive("laravel", { rerun: false });
  setMeter(null, "idle");
}

bind();
