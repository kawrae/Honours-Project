const $ = (id) => document.getElementById(id);

const state = {
  active: "laravel", // "laravel" | "ci"
  urls: {
    laravel: "http://laravel-bench.local",
    ci: "http://ci-bench.local",
  },
};

function readInputs() {
  state.urls.laravel = $("urlLaravel").value.trim() || state.urls.laravel;
  state.urls.ci = $("urlCI").value.trim() || state.urls.ci;
}

function setActive(env) {
  state.active = env;
  $("tabLaravel").setAttribute("aria-selected", env === "laravel" ? "true" : "false");
  $("tabCI").setAttribute("aria-selected", env === "ci" ? "true" : "false");
  $("activeEnvPill").textContent = `Active: ${env === "laravel" ? "Laravel" : "CodeIgniter"}`;

  $("paneActiveTitle").textContent = env === "laravel" ? "Laravel" : "CodeIgniter";
  $("paneOtherTitle").textContent = env === "laravel" ? "CodeIgniter" : "Laravel";
}

function otherEnv() {
  return state.active === "laravel" ? "ci" : "laravel";
}

function baseUrl(env) {
  return state.urls[env].replace(/\/+$/, "");
}

function setMeter(kind, text) {
  const dot = $("meterDot");
  dot.classList.remove("good", "bad", "warn");
  if (kind) dot.classList.add(kind);
  $("meterText").textContent = text;
}

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function addLog({ env, path, status, ms }) {
  const ok = status >= 200 && status < 300;
  const tagClass = ok ? "good" : status >= 400 ? "bad" : "warn";

  const item = document.createElement("div");
  item.className = "log-item";

  const left = document.createElement("div");
  left.className = "log-left";

  const tag = document.createElement("span");
  tag.className = `tag ${tagClass}`;
  tag.textContent = env === "laravel" ? "LARAVEL" : "CI";

  const p = document.createElement("span");
  p.className = "path";
  p.textContent = `${path}`;

  left.appendChild(tag);
  left.appendChild(p);

  const right = document.createElement("div");
  right.className = "log-right";
  right.textContent = `${status} • ${ms}ms`;

  item.appendChild(left);
  item.appendChild(right);

  $("log").prepend(item);
}

async function timedFetch(env, path, options = {}) {
  readInputs();
  const url = `${baseUrl(env)}${path}`;

  const t0 = performance.now();
  let res, data, status;

  try {
    res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    status = res.status;

    // Attempt JSON; fall back to text.
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
  } catch (e) {
    const ms = Math.round(performance.now() - t0);
    addLog({ env, path, status: 0, ms });
    throw e;
  }

  const ms = Math.round(performance.now() - t0);
  addLog({ env, path, status, ms });

  return { status, ms, data };
}

async function runSingle(path, options = {}) {
  const env = state.active;
  setMeter("warn", `fetching ${path}…`);

  const outEl = $("outActive");
  const badge = $("paneActiveLatency");

  try {
    const { status, ms, data } = await timedFetch(env, path, options);
    badge.textContent = `${ms}ms`;
    $("lastLatency").textContent = `${ms}ms`;
    setMeter(status >= 200 && status < 300 ? "good" : "bad", `done • ${ms}ms`);
    outEl.textContent = pretty(data);
    return { status, ms, data };
  } catch (e) {
    badge.textContent = `—`;
    setMeter("bad", "error");
    outEl.textContent = `Request failed.\n\n${String(e)}`;
    return null;
  }
}

async function runCompare(path, options = {}) {
  const a = state.active;
  const b = otherEnv();

  $("paneOther").hidden = false;

  setMeter("warn", `compare ${path}…`);

  const outA = $("outActive");
  const outB = $("outOther");
  const badgeA = $("paneActiveLatency");
  const badgeB = $("paneOtherLatency");

  try {
    const [ra, rb] = await Promise.all([
      timedFetch(a, path, options),
      timedFetch(b, path, options),
    ]);

    badgeA.textContent = `${ra.ms}ms`;
    badgeB.textContent = `${rb.ms}ms`;

    $("lastLatency").textContent = `${Math.min(ra.ms, rb.ms)}–${Math.max(ra.ms, rb.ms)}ms`;

    const good = (r) => r.status >= 200 && r.status < 300;
    const overallGood = good(ra) && good(rb);

    setMeter(overallGood ? "good" : "bad", overallGood ? "done" : "done (errors)");

    outA.textContent = pretty(ra.data);
    outB.textContent = pretty(rb.data);

    return { ra, rb };
  } catch (e) {
    setMeter("bad", "error");
    outA.textContent = `Request failed.\n\n${String(e)}`;
    outB.textContent = `Request failed.\n\n${String(e)}`;
    return null;
  }
}

function run(path, options = {}) {
  const mode = $("mode").value;
  if (mode === "compare") return runCompare(path, options);
  $("paneOther").hidden = true;
  return runSingle(path, options);
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

  // Update mini panel from active env only (clean + simple)
  if (dbRes.data && typeof dbRes.data.count !== "undefined") {
    $("dbCount").textContent = String(dbRes.data.count);
  } else {
    $("dbCount").textContent = "—";
  }

  // ping may be compare or single
  $("pingStatus").textContent = "ok";
}

async function createItem() {
  const name = $("newName").value.trim() || "Bench Insert";
  const description = $("newDesc").value.trim() || "Insert test";

  await run("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });

  // Refresh items for a satisfying feedback loop
  await run("/api/items");
}

async function deleteItemOne() {
  await run("/api/items/1", { method: "DELETE" });
  await run("/api/items");
}

function init() {
  $("urlLaravel").value = state.urls.laravel;
  $("urlCI").value = state.urls.ci;

  setActive("laravel");

  $("tabLaravel").addEventListener("click", () => setActive("laravel"));
  $("tabCI").addEventListener("click", () => setActive("ci"));
  $("swapBtn").addEventListener("click", () => setActive(otherEnv()));

  $("runHealth").addEventListener("click", healthChecks);
  $("clearLog").addEventListener("click", () => ($("log").innerHTML = ""));

  $("loadItems").addEventListener("click", () => run("/api/items"));
  $("loadOne").addEventListener("click", () => run("/api/items/1"));
  $("createItem").addEventListener("click", createItem);
  $("deleteOne").addEventListener("click", deleteItemOne);

  // Default UI state
  setMeter(null, "idle");
  $("paneOther").hidden = $("mode").value !== "compare";
  $("mode").addEventListener("change", () => {
    $("paneOther").hidden = $("mode").value !== "compare";
  });
}

init();
