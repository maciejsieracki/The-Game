// Spike RR-T1 wizard (R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1).
// Drives the owner through the checks; every observation is sent to Rust,
// which evaluates and writes the report. No result is decided here.
"use strict";

const T = window.__TAURI__;
const invoke = T.core.invoke;
const listen = T.event.listen;

const N_EVENTS = 1000;          // dispatch: 1000 PointerMove
const CLICK_TIMEOUT_MS = 20000;
const KEY_TIMEOUT_MS = 15000;

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => performance.now();

function log(msg) {
  const el = $("log");
  el.textContent += `[${now().toFixed(1)}] ${msg}\n`;
  el.scrollTop = el.scrollHeight;
}
function step(html) { $("step").innerHTML = html; }

// ---------------------------------------------------------------- UI rects
let rectSeq = 0;
function uiRects() {
  return [...document.querySelectorAll("[data-ui-rect]")].map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.dataset.uiRect, x: r.x, y: r.y, w: r.width, h: r.height };
  });
}
function overUi(x, y) {
  return uiRects().some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}
async function sendRects() {
  rectSeq += 1;
  await invoke("spike_ui_rects", { rects: {
    seq: rectSeq, viewport_w: innerWidth, viewport_h: innerHeight,
    device_pixel_ratio: devicePixelRatio, rects: uiRects() } });
}
new ResizeObserver(() => { sendRects().catch((e) => log("ui_rects: " + e)); }).observe(document.body);

// ---------------------------------------------------------------- DOM observations
const dom = { pointerdowns: [], keys: [], uiClicks: 0 };
function report(kind, extra) {
  const o = Object.assign({ kind, x: null, y: null, key: null, target_id: null,
                            has_focus: document.hasFocus(), t_js: now() }, extra || {});
  invoke("spike_dom", { obs: o }).catch((e) => log("spike_dom: " + e));
}
document.addEventListener("pointerdown", (e) => {
  const inUi = overUi(e.clientX, e.clientY);
  dom.pointerdowns.push({ x: e.clientX, y: e.clientY, inUi, t: now() });
  report(inUi ? "pointerdown-ui" : "pointerdown-hole",
         { x: e.clientX, y: e.clientY, target_id: e.target && e.target.id || null });
}, true);
document.addEventListener("keydown", (e) => {
  dom.keys.push({ key: e.key, t: now() });
  report("keydown", { key: e.key });
}, true);
$("ui-button").addEventListener("click", (e) => {
  dom.uiClicks += 1;
  report("click-ui-button", { x: e.clientX, y: e.clientY, target_id: "ui-button" });
});

// ---------------------------------------------------------------- helpers
function ask(stepId, question, answers) {
  step(question);
  const box = $("btns");
  box.innerHTML = "";
  return new Promise((resolve) => {
    for (const a of answers) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = a;
      b.onclick = async () => {
        box.innerHTML = "";
        await invoke("spike_answer", { answer: { step: stepId, answer: a, note: null } });
        log(`odpowiedz ${stepId}: ${a}`);
        resolve(a);
      };
      box.appendChild(b);
    }
  });
}

async function waitFor(pred, timeoutMs, pollMs = 100) {
  const t0 = now();
  while (now() - t0 < timeoutMs) {
    if (await pred()) return true;
    await sleep(pollMs);
  }
  return false;
}

// Guided click into the hole (map area) or onto the UI button.
async function guidedClick(label, where) {
  const pd0 = dom.pointerdowns.length;
  const ui0 = dom.uiClicks;
  await invoke("spike_window_begin", { label });
  if (where === "hole") {
    step("Kliknij <b>lewym przyciskiem</b> w <b>POMARANCZOWY TROJKAT</b> (po lewej stronie okna, poza panelem).");
  } else {
    $("ui-button").style.display = "inline-block";
    step("Kliknij zielony przycisk <b>PRZYCISK UI</b> w tym panelu.");
  }
  const webviewSeen = () => where === "hole"
    ? dom.pointerdowns.slice(pd0).some((p) => !p.inUi)
    : dom.uiClicks > ui0;
  let nativeSeen = false;
  const got = await waitFor(async () => {
    const p = await invoke("spike_window_poll", { label });
    nativeSeen = p.buttons > 0;
    return nativeSeen || webviewSeen();
  }, CLICK_TIMEOUT_MS);
  await sleep(400); // let the other side report too, if it also got the click
  $("ui-button").style.display = "none";
  const obs = await invoke("spike_click_end", { label, webview_seen: webviewSeen() });
  log(`${label}: ${got ? "" : "(TIMEOUT) "}natywne=${obs.native} webview=${obs.webview}`);
  return obs;
}

let focusDone = false;
async function focusTest() {
  if (focusDone) return;
  focusDone = true;
  for (const label of ["key_direct", "key_after_set_focus"]) {
    if (label === "key_after_set_focus") {
      await invoke("spike_webview_set_focus").catch((e) => log("set_focus: " + e));
      await sleep(200);
    }
    const k0 = dom.keys.length;
    await invoke("spike_window_begin", { label });
    step(label === "key_direct"
      ? "NIE klikaj niczego. Nacisnij teraz klawisz <b>K</b>."
      : "Rust wywolal Webview::set_focus. Nacisnij jeszcze raz klawisz <b>K</b>.");
    await waitFor(async () => {
      const p = await invoke("spike_window_poll", { label });
      return p.keys > 0 || dom.keys.length > k0;
    }, KEY_TIMEOUT_MS);
    await sleep(300);
    const seen = dom.keys.length > k0;
    await invoke("spike_key_end", { label, webview_seen: seen, has_focus: document.hasFocus() });
    log(`${label}: webview=${seen} hasFocus=${document.hasFocus()}`);
  }
}

// Mechanism test (M1 or M2): visual question, hole click, focus, UI click.
async function mechanism(name) {
  const applyCmd = name === "m1" ? "spike_m1_apply" : "spike_m2_start";
  let applied;
  try {
    applied = await invoke(applyCmd);
    log(`${name}: ${applied}`);
  } catch (e) {
    log(`${name}: NIEDOSTEPNE: ${e}`);
    return { ok: false, unavailable: true };
  }
  await sendRects();
  await ask(`${name}_visible`,
    `${name.toUpperCase()} wlaczone. Czy <b>nadal</b> widzisz pomaranczowy trojkat na granatowym tle <b>oraz</b> ten panel i pasek u gory?`,
    ["TAK", "NIE", "MIGA"]);
  const hole = await guidedClick(`${name}_hole`, "hole");
  if (hole.native) await focusTest();
  const ui = await guidedClick(`${name}_ui`, "ui");
  const ok = hole.native && !hole.webview && ui.webview && !ui.native;
  if (name === "m1") await invoke("spike_m1_clear").then((m) => log(m)).catch((e) => log("m1 clear: " + e));
  return { ok, unavailable: false };
}

// ---------------------------------------------------------------- IPC
async function clockSync() {
  const samples = [];
  for (let i = 0; i < 50; i++) {
    const t0 = now();
    const tr = await invoke("spike_clock_now");
    const t1 = now();
    samples.push({ t0_js: t0, t_rust: tr, t1_js: t1 });
  }
  const o = await invoke("spike_clock_samples", { samples });
  log(`zegar: offset=${o.offset_ms.toFixed(3)} ms, +-${o.uncertainty_ms.toFixed(3)} ms`);
}

function pmPayload(seq) {
  const x = 100 + (seq % 400), y = 100 + ((seq * 7) % 300);
  return { seq, t_js: now(), input: { scene: "Map", over_ui: false, ev: { PointerMove: { x, y } } } };
}

async function ipcWebviewToRust() {
  step("Pomiar IPC webview &rarr; Rust: 1000 x PointerMove, 1 na klatke (~17 s), potem seria ciagla.");
  await clockSync();
  for (let seq = 0; seq < N_EVENTS; seq++) {
    await new Promise((r) => requestAnimationFrame(r));
    invoke("spike_pointer_move", { mode: "paced", input: pmPayload(seq) }).catch((e) => log("pm: " + e));
  }
  await sleep(500);
  const paced = await invoke("spike_w2r_done", { mode: "paced" });
  log("w2r paced: " + paced.msg);
  const ps = [];
  for (let seq = 0; seq < N_EVENTS; seq++) {
    ps.push(invoke("spike_pointer_move", { mode: "burst", input: pmPayload(seq) }));
  }
  await Promise.allSettled(ps);
  const burst = await invoke("spike_w2r_done", { mode: "burst" });
  log("w2r burst: " + burst.msg);
}

async function ipcRustToWebview() {
  step("Pomiar IPC Rust &rarr; webview: 1000 zdarzen co 8 ms (~8 s).");
  await clockSync();
  const received = [];
  let last = false;
  const un = await listen("r2w_ping", (ev) => {
    const t = now();
    received.push({ seq: ev.payload.seq, t_rust: ev.payload.t_rust, t_js_recv: t });
    if (ev.payload.last) last = true;
  });
  await invoke("spike_r2w_start", { count: N_EVENTS, interval_ms: 8 });
  await waitFor(async () => last, 30000, 50);
  await sleep(300);
  un();
  const r = await invoke("spike_r2w_result", { result: { received } });
  log("r2w: " + r.msg);
}

// ---------------------------------------------------------------- main
async function main() {
  const st0 = await invoke("spike_status");
  $("platform").textContent = st0.platform;
  await sendRects();
  setInterval(async () => {
    try {
      const s = await invoke("spike_status");
      $("status").textContent = `klatki wgpu: ${s.frames} (pominiete ${s.skipped}); renderowanie: ${
        s.render_s == null ? "-" : s.render_s.toFixed(0) + " s"}; probki pamieci: ${s.memory_samples}`;
    } catch (e) { /* ignore */ }
  }, 1000);

  // (1)
  await ask("p1_visible",
    "Krok 1. Czy widzisz <b>granatowe tlo</b> z <b>pomaranczowym trojkatem</b> po lewej, a <b>nad nimi</b> ten panel i bialy pasek u gory?",
    ["TAK", "NIE", "MIGA"]);

  // (2) M1, (6) focus inside
  const m1 = await mechanism("m1");
  // (3) M2 only when M1 failed / unavailable, or forced
  if (!m1.ok || st0.force_m2) {
    await mechanism("m2");
  } else {
    log("M2 pominiete (M1 = OK); wymus: SPIKE_FORCE_M2=1");
  }

  // (4)
  await ipcWebviewToRust();
  await ipcRustToWebview();

  // (7)
  step("Test pelnego ekranu: okno przejdzie na pelny ekran na ok. 1,5 s i wroci. Nic nie klikaj.");
  await sleep(1500);
  const fs = await invoke("spike_fullscreen_test");
  log(`fullscreen: po set(true)=${fs.after_on} po set(false)=${fs.after_off}`);

  // (5) wait until the 65 s memory sample exists
  step("Pomiar pamieci: czekam, az renderowanie trwa co najmniej 66 s&hellip;");
  await waitFor(async () => (await invoke("spike_status")).memory_samples >= 5, 120000, 1000);

  const fin = await invoke("spike_finish");
  step(`<b>Gotowe.</b> Raport: <code>${fin.report}</code><br>Odeslij ten plik JSON oraz plik <code>log-*.txt</code> z tego samego katalogu.`);
  log(fin.summary.join("\n"));
}

main().catch((e) => { log("BLAD KREATORA: " + e); step("Blad kreatora: " + e + " &mdash; zamknij okno (raport zapisze sie przy zamknieciu)."); });
