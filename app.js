const $ = (id) => document.getElementById(id);

const state = {
  active: "laravel",
  urls: {
    laravel: "http://laravel-bench.local",
    ci: "http://ci-bench.local",
    symfony: "http://symfony-bench.local",
    yii: "http://yii-bench.local",
  },
  lastPath: "/api/items",
};

const envs = ["laravel", "ci", "symfony", "yii"];

function envLabel(env) {
  if (env === "laravel") return "Laravel";
  if (env === "ci") return "CodeIgniter";
  if (env === "symfony") return "Symfony";
  return "Yii";
}

function envTag(env) {
  if (env === "laravel") return "LARAVEL";
  if (env === "ci") return "CODEIGNITER";
  if (env === "symfony") return "SYMFONY";
  return "YII";
}

function nextEnv(env = state.active) {
  const i = envs.indexOf(env);
  return envs[(i + 1) % envs.length];
}

function otherEnv() {
  return nextEnv(state.active);
}

function baseUrl(env) {
  return state.urls[env].replace(/\/+$/, "");
}

function readInputs() {
  state.urls.laravel = $("urlLaravel").value.trim() || state.urls.laravel;
  state.urls.ci = $("urlCI").value.trim() || state.urls.ci;
  state.urls.symfony = $("urlSymfony").value.trim() || state.urls.symfony;
  state.urls.yii = $("urlYii").value.trim() || state.urls.yii;
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

function resetPanes() {
  $("paneActiveLatency").textContent = "—";
  $("paneOtherLatency").textContent = "—";
  $("lastLatency").textContent = "—";

  $("outActive").textContent = "Press “Load Items”.";
  $("outOther").textContent = "Compare mode will show both.";

  setMeter(null, "idle");
}

function setActive(env) {
  state.active = env;

  $("tabLaravel").setAttribute("aria-selected", env === "laravel" ? "true" : "false");
  $("tabCI").setAttribute("aria-selected", env === "ci" ? "true" : "false");
  $("tabSymfony").setAttribute("aria-selected", env === "symfony" ? "true" : "false");
  $("tabYii").setAttribute("aria-selected", env === "yii" ? "true" : "false");

  $("activeEnvPill").textContent = `Active: ${envLabel(env)}`;

  $("paneActiveTitle").textContent = envLabel(env);
  $("paneOtherTitle").textContent = envLabel(otherEnv());

  resetPanes();
  setItemsViewActive("items");
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
  tag.textContent = envTag(env);

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
        Accept: "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    status = res.status;

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

    const ok = status >= 200 && status < 300;
    setMeter(ok ? "good" : "bad", `done • ${ms}ms`);

    outEl.textContent = pretty(data);
    return { status, ms, data };
  } catch (e) {
    badge.textContent = "—";
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
    const [ra, rb] = await Promise.all([timedFetch(a, path, options), timedFetch(b, path, options)]);

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

  const pingRes = await run("/api/bench/ping");
  if (!pingRes) return;

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

  await run("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });

  await run("/api/items");
}

async function deleteItemOne() {
  await run("/api/items/1", { method: "DELETE" });
  await run("/api/items");
}

function setItemsViewActive(which) {
  const loadItemsBtn = $("loadItems");
  const loadOneBtn = $("loadOne");
  const runBenchBtn = $("runBench10");

  const setPrimary = (btn) => btn.classList.remove("ghost");
  const setGhost = (btn) => btn.classList.add("ghost");

  setGhost(loadItemsBtn);
  setGhost(loadOneBtn);
  setGhost(runBenchBtn);

  if (which === "items") setPrimary(loadItemsBtn);
  else if (which === "one") setPrimary(loadOneBtn);
  else if (which === "bench") setPrimary(runBenchBtn);
}

function stats(msList) {
  const n = msList.length;
  const sorted = [...msList].sort((a, b) => a - b);
  const sum = msList.reduce((a, b) => a + b, 0);
  const pick = (p) => {
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))));
    return sorted[idx];
  };
  return {
    n,
    min: sorted[0],
    max: sorted[n - 1],
    mean: Math.round((sum / n) * 100) / 100,
    p50: pick(0.5),
    p95: pick(0.95),
  };
}

async function runBenchmark(times = 10) {
  setItemsViewActive("bench");
  const path = state.lastPath || "/api/items";
  const mode = $("mode").value;

  const a = state.active;
  const b = otherEnv();

  $("paneOther").hidden = mode !== "compare";

  $("outActive").textContent = "";
  $("paneActiveLatency").textContent = "…";

  if (mode === "compare") {
    $("outOther").textContent = "";
    $("paneOtherLatency").textContent = "…";
  }

  setMeter("warn", `benchmark ${path} ×${times}…`);

  try {
    if (mode === "compare") {
      const aMs = [];
      const bMs = [];

      for (let i = 0; i < times; i++) {
        const ra = await timedFetch(a, path);
        const rb = await timedFetch(b, path);
        aMs.push(ra.ms);
        bMs.push(rb.ms);
      }

      const result = {
        path,
        runs: times,
        [envLabel(a)]: stats(aMs),
        [envLabel(b)]: stats(bMs),
      };

      $("outActive").textContent = pretty(result[envLabel(a)]);
      $("outOther").textContent = pretty(result[envLabel(b)]);

      $("paneActiveLatency").textContent = `${result[envLabel(a)].mean}ms`;
      $("paneOtherLatency").textContent = `${result[envLabel(b)].mean}ms`;

      $("lastLatency").textContent =
        `${Math.min(result[envLabel(a)].mean, result[envLabel(b)].mean)}–` +
        `${Math.max(result[envLabel(a)].mean, result[envLabel(b)].mean)}ms`;

      setMeter("good", `done • ${path} ×${times}`);
      return result;
    } else {
      const msList = [];

      for (let i = 0; i < times; i++) {
        const r = await timedFetch(a, path);
        msList.push(r.ms);
      }

      const result = {
        path,
        runs: times,
        [envLabel(a)]: stats(msList),
      };

      $("outActive").textContent = pretty(result[envLabel(a)]);
      $("paneActiveLatency").textContent = `${result[envLabel(a)].mean}ms`;
      $("lastLatency").textContent = `${result[envLabel(a)].mean}ms`;

      setMeter("good", `done • ${path} ×${times}`);
      return result;
    }
  } catch (e) {
    setMeter("bad", "error");
    $("outActive").textContent = `Benchmark failed.\n\n${String(e)}`;
    if (mode === "compare") $("outOther").textContent = `Benchmark failed.\n\n${String(e)}`;
    return null;
  }
}

function init() {
  $("urlLaravel").value = state.urls.laravel;
  $("urlCI").value = state.urls.ci;
  $("urlSymfony").value = state.urls.symfony;
  $("urlYii").value = state.urls.yii;

  setActive("laravel");
  setItemsViewActive("items");

  $("tabLaravel").addEventListener("click", () => setActive("laravel"));
  $("tabCI").addEventListener("click", () => setActive("ci"));
  $("tabSymfony").addEventListener("click", () => setActive("symfony"));
  $("tabYii").addEventListener("click", () => setActive("yii"));
  $("swapBtn").addEventListener("click", () => setActive(nextEnv()));

  $("runHealth").addEventListener("click", healthChecks);
  $("clearLog").addEventListener("click", () => ($("log").innerHTML = ""));

  $("loadItems").addEventListener("click", () => {
    setItemsViewActive("items");
    state.lastPath = "/api/items";
    run("/api/items");
  });
  $("loadOne").addEventListener("click", () => {
    setItemsViewActive("one");
    state.lastPath = "/api/items/1";
    run("/api/items/1");
  });
  $("runBench10").addEventListener("click", () => {
    setItemsViewActive("bench");
    runBenchmark(10);
  });
  $("createItem").addEventListener("click", createItem);
  $("deleteOne").addEventListener("click", deleteItemOne);

  setMeter(null, "idle");

  $("paneOther").hidden = $("mode").value !== "compare";
  $("mode").addEventListener("change", () => {
    $("paneOther").hidden = $("mode").value !== "compare";
    $("paneOtherTitle").textContent = envLabel(otherEnv());
    resetPanes();
  });
}

init();
