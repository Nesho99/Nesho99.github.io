// Decorative Slack-style alert feed and a live "kubectl logs -f" window. Purely for fun: nothing here is real.
(() => {
  "use strict";

  const feed = document.getElementById("feed");
  const muteBtn = document.getElementById("mute");
  const ghostLog = document.getElementById("ghost-log");
  if (!feed || !muteBtn) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const wide = matchMedia("(min-width: 1320px)");
  const MAX_VISIBLE = 3;
  const LIFETIME = 8000;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  };
  const savedMute = store.get("alerts-muted");
  let muted = savedMute === null ? reducedMotion.matches : savedMute === "1";

  // ---------- bots and events ----------
  const BOTS = {
    kube:    { name: "kube-events",    mono: "K8", color: "#326CE5" },
    argo:    { name: "argocd",         mono: "AR", color: "#E96D3F" },
    trivy:   { name: "trivy-cron",     mono: "TV", color: "#0B6E6E" },
    keda:    { name: "keda",           mono: "KE", color: "#3D5A98" },
    cert:    { name: "cert-manager",   mono: "CM", color: "#2E7D4F" },
    secrets: { name: "secret-rotator", mono: "SR", color: "#0B6E6E" },
    karp:    { name: "karpenter",      mono: "KP", color: "#6E4BA8" },
    zpa:     { name: "zscaler-zpa",    mono: "ZS", color: "#2563C9" },
    scim:    { name: "okta-scim",      mono: "OK", color: "#1A1A1A" },
    cf:      { name: "cloudflare",     mono: "CF", color: "#E8730C" },
    falco:   { name: "falco",          mono: "FA", color: "#0093A8" },
    gk:      { name: "gatekeeper",     mono: "GK", color: "#8A3B3B" },
    ci:      { name: "artifacts",      mono: "CI", color: "#555555" },
    tfc:     { name: "terraform",      mono: "TF", color: "#7B42BC" },
  };

  // level: ok | warn | bad | info. `then` is a thread reply that follows.
  const EVENTS = [
    { bot: "kube", ch: "k8s-events", level: "bad", text: "🔴 Pod `public-api-7d9f8-x2kq4` OOMKilled (exit 137)",
      log: "WARN public-api-7d9f8 OOMKilled",
      then: { delay: 3400, level: "ok", text: "✅ ReplicaSet replaced it · `3/3 Ready` · self-healed in 11s", react: "🩹 3", log: "INFO public-api 3/3 Ready" } },
    { bot: "trivy", ch: "security", level: "ok", text: "⏱ cron `0 */6 * * *` · scanned 42 images · CRITICAL 0 · HIGH 0", react: "✅ 4",
      log: "INFO trivy: 42 images, 0 crit" },
    { bot: "argo", ch: "deploys", level: "ok", text: "🚀 `public-api` synced to `a1c9e3f` · Healthy",
      log: "INFO argocd sync: Synced/Healthy" },
    { bot: "keda", ch: "k8s-events", level: "info", text: "📈 Scaled `kafka-consumer` 2 → 6 replicas · lag 12.4k",
      log: "INFO keda scaled consumer 2→6",
      then: { delay: 5200, level: "ok", text: "📉 Scaled `kafka-consumer` 6 → 2 · lag 0", log: "INFO keda scaled consumer 6→2" } },
    { bot: "cert", ch: "security", level: "ok", text: "🔒 Certificate `nesho-sh-tls` renewed · valid 90d",
      log: "INFO cert nesho-sh-tls renewed" },
    { bot: "secrets", ch: "security", level: "ok", text: "🔐 cron `0 3 * * 1` · rotated 18 secrets · 0 downtime", react: "🙌 6",
      log: "INFO rotate secrets: 18 ok" },
    { bot: "karp", ch: "k8s-events", level: "warn", text: "⚠️ Node `ip-10-0-3-14` NotReady → cordoned + drained",
      log: "WARN node ip-10-0-3-14 NotReady",
      then: { delay: 4400, level: "ok", text: "✅ Replacement node Ready in 94s · pods rescheduled", log: "INFO node replaced in 94s" } },
    { bot: "zpa", ch: "network", level: "ok", text: "🛡 Connector `eu-central-1a` upgraded · 0 sessions dropped",
      log: "INFO zscaler connectors upgraded" },
    { bot: "scim", ch: "identity", level: "ok", text: "👥 SCIM sync · +2 users · −1 user · 0 errors",
      log: "INFO scim sync: 0 errors" },
    { bot: "cf", ch: "edge", level: "info", text: "🧱 WAF blocked 312 requests from 1 ASN · rule `bot-fight`",
      log: "INFO waf: 312 blocked" },
    { bot: "kube", ch: "k8s-events", level: "warn", text: "⚠️ Liveness probe failed · `auth-proxy` restarting",
      log: "WARN auth-proxy liveness failed",
      then: { delay: 3000, level: "ok", text: "✅ `auth-proxy` Ready · restarts: 1", log: "INFO auth-proxy Ready" } },
  ];

  const FIRST = { bot: "falco", ch: "security", level: "warn", text: "👀 Terminal shell opened on `nesho.sh` by `visitor`",
    log: "WARN falco: shell in nesho.sh",
    then: { delay: 2800, level: "ok", text: "Marked as expected — it's a portfolio. Welcome 👋", react: "👋 1", log: "INFO falco: expected" } };

  // Reactions to what the visitor runs in the terminal.
  const ON_COMMAND = [
    [/^sudo( |$)/, { bot: "falco", ch: "security", level: "bad", text: "🚨 Privilege escalation attempt by `visitor` · blocked", react: "😅 1", log: "WARN falco: sudo by visitor" }],
    [/^rm( |$)/, { bot: "gk", ch: "security", level: "bad", text: "⛔ Denied `rm -rf /` · policy `no-destructive-ops`", log: "WARN gatekeeper: denied rm -rf" }],
    [/^(cv|resume|download cv)$/, { bot: "ci", ch: "deploys", level: "ok", text: "📄 `Neven_Geci_CV.pdf` pulled by `visitor` · thanks for reading", react: "🙏 1", log: "INFO artifact pulled: cv.pdf" }],
    [/^(trivy|scan)/, { bot: "trivy", ch: "security", level: "ok", text: "🔎 On-demand scan by `visitor` · 0 findings", log: "INFO trivy: on-demand, 0 findings" }],
    [/^(contact|email|linkedin)$/, { bot: "scim", ch: "identity", level: "info", text: "📇 `visitor` looked up contact details · say hi!", log: "INFO contact lookup" }],
  ];

  // ---------- rendering ----------
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  // `code` spans like Slack, everything else as plain text.
  function richText(s) {
    const frag = document.createDocumentFragment();
    s.split("`").forEach((part, i) => frag.append(i % 2 ? el("code", "", part) : part));
    return frag;
  }

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let hovering = false;
  feed.addEventListener("mouseenter", () => { hovering = true; });
  feed.addEventListener("mouseleave", () => { hovering = false; });

  function toast(ev, parent) {
    const bot = BOTS[ev.bot || (parent && parent.bot)];
    const t = el("div", `toast ${ev.level || "info"} enter`);

    const avatar = el("div", "avatar", bot.mono);
    avatar.style.background = bot.color;

    const body = el("div", "body");
    const who = el("div", "who");
    who.append(el("b", "", bot.name), el("span", "app", "APP"), el("span", "when", now()));
    const chan = el("div", "chan", parent ? `↳ replied in thread · #${parent.ch}` : `#${ev.ch}`);
    const msg = el("div", "msg");
    msg.append(richText(ev.text));
    body.append(who, chan, msg);
    if (ev.react) body.append(el("span", "react", ev.react));
    if (ev.then) body.append(el("div", "thread", "1 reply"));

    t.append(avatar, body);
    feed.append(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.remove("enter")));

    while (feed.children.length > MAX_VISIBLE) feed.firstElementChild.remove();
    const dismiss = () => {
      if (!t.isConnected) return;
      if (hovering) { setTimeout(dismiss, 1200); return; }
      t.classList.add("leave");
      setTimeout(() => t.remove(), 450);
    };
    setTimeout(dismiss, LIFETIME);

    if (ev.log) logLine(ev.log);
  }

  function post(ev) {
    if (muted || !wide.matches || document.hidden) return;
    toast(ev);
    if (ev.then) setTimeout(() => { if (!muted) toast(ev.then, ev); }, ev.then.delay);
  }

  // ---------- live log window ----------
  const AMBIENT = [
    "INFO argocd sync: Synced/Healthy",
    "INFO sso: login ok (okta)",
    "INFO hpa: cpu 41% target 70%",
    "INFO coralogix: 0 alerts firing",
    "INFO kafka lag: 0",
    "INFO cloudflare: cache hit 94%",
    "INFO probe /healthz 200 3ms",
    "INFO zpa: 2/2 connectors healthy",
    "WARN cert expires in 29d",
  ];
  const MAX_LOG = 6;

  function logLine(text) {
    if (!ghostLog) return;
    const [lvl, ...rest] = text.split(" ");
    const d = el("div", "ll fresh");
    d.append(el("span", lvl === "WARN" ? "lvl warn" : "lvl", lvl), " " + rest.join(" "));
    ghostLog.append(d);
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.remove("fresh")));
    while (ghostLog.children.length > MAX_LOG) ghostLog.firstElementChild.remove();
  }

  // ---------- background windows ----------
  // Only animate when someone can see it and hasn't muted it; otherwise they stay as a still picture.
  const active = () => !muted && wide.matches && !document.hidden;
  const sfx = () => Math.random().toString(36).slice(2, 7);
  const row = (...parts) => {
    const d = el("div");
    parts.forEach((p) => d.append(typeof p === "string" ? p : el("span", p[0], p[1])));
    return d;
  };

  // watch kubectl get pods: now and then a pod dies and gets replaced
  const podsEl = document.getElementById("ghost-pods");
  const PODS = ["public-api", "public-api", "auth-proxy", "kafka-consumer", "argocd-server", "keda-operator", "falco"]
    .map((name) => ({ name, id: sfx(), status: "Running", restarts: Math.random() < 0.3 ? 1 : 0 }));
  const STATUS_CLASS = { Running: "ok", Terminating: "warn", ContainerCreating: "", CrashLoopBackOff: "bad" };

  function renderPods() {
    if (!podsEl) return;
    podsEl.replaceChildren(
      row("NAME".padEnd(24) + "STATUS".padEnd(19) + "↻"),
      ...PODS.map((p) => row(`${p.name}-${p.id}`.padEnd(24), [STATUS_CLASS[p.status], p.status.padEnd(19)], String(p.restarts))),
    );
  }

  function heal(pod, from = "Terminating") {
    pod.status = from;
    renderPods();
    setTimeout(() => { pod.id = sfx(); pod.status = "ContainerCreating"; renderPods(); }, 1600 + Math.random() * 800);
    setTimeout(() => { pod.status = "Running"; pod.restarts += from === "CrashLoopBackOff" ? 1 : 0; renderPods(); }, 3600 + Math.random() * 1500);
  }

  function podsChaos() {
    PODS.forEach((p, i) => setTimeout(() => heal(p, "CrashLoopBackOff"), i * 180));
  }

  // crontab -l with live countdowns
  const cronEl = document.getElementById("ghost-cron");
  const CRON = [
    { spec: "0 */6 * * *", job: "trivy-scan", every: 6 * 3600, left: 3600 + 42 * 60 + 10 },
    { spec: "0 3 * * 1", job: "rotate-secrets", every: 7 * 86400, left: 2 * 86400 + 11 * 3600 + 180 },
    { spec: "*/15 * * * *", job: "scim-sync", every: 900, left: 8 * 60 + 21 },
    { spec: "0 2 * * *", job: "backup-verify", every: 86400, left: 13 * 3600 + 12 * 60 + 44 },
    { spec: "* * * * *", job: "cert-check", every: 60, left: 23 },
  ];
  const two = (n) => String(n).padStart(2, "0");
  function fmt(s) {
    const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    return d ? `${d}d ${two(h)}:${two(m)}` : `${two(h)}:${two(m)}:${two(s % 60)}`;
  }
  function renderCron() {
    if (!cronEl) return;
    cronEl.replaceChildren(
      row("# schedule".padEnd(15) + "job".padEnd(16) + "next"),
      ...CRON.map((c) => row(c.spec.padEnd(15) + c.job.padEnd(16), c.flash ? ["hl", "running ✓"] : fmt(c.left))),
    );
  }
  function tickCron() {
    if (!active()) return;
    CRON.forEach((c) => {
      if (c.flash) c.flash -= 1;
      c.left -= 1;
      if (c.left <= 0) { c.left = c.every; c.flash = 2; logLine(`INFO cron: ${c.job} ok`); }
    });
    renderCron();
  }

  // trivy image --watch: scan images one by one, then report zero findings and start over
  const trivyEl = document.getElementById("ghost-trivy");
  const IMAGES = ["public-api:a1c9e3f", "auth-proxy:1.8.2", "kafka-consumer:3.2", "argocd:v2.12.3", "keda:2.15.1", "falco:0.38.2"];
  let scan = { i: 0, pct: 0, done: false, rest: 0 };
  function renderTrivy() {
    if (!trivyEl) return;
    trivyEl.replaceChildren(...IMAGES.map((img, i) => {
      const pct = i < scan.i ? 100 : i === scan.i ? scan.pct : 0;
      const n = Math.round(pct / 10);
      const result = pct === 100 ? ["ok", "0 crit ✓"] : pct ? `${pct}%` : ["", "queued"];
      return row(img.padEnd(20), ["bar-fill", "█".repeat(n)], "░".repeat(10 - n) + "  ", result);
    }), scan.done ? row("Total: 0 ", ["", "(CRITICAL: 0, HIGH: 0) "], ["hl", "PASS"]) : row(" "));
  }
  function tickTrivy() {
    if (!active()) return;
    if (scan.done) {
      if (++scan.rest > 8) scan = { i: 0, pct: 0, done: false, rest: 0 };
    } else {
      scan.pct = Math.min(100, scan.pct + 10 + Math.floor(Math.random() * 25));
      if (scan.pct === 100) {
        scan.i += 1;
        scan.pct = 0;
        if (scan.i >= IMAGES.length) { scan.done = true; logLine("INFO trivy: 6 images, 0 crit"); }
      }
    }
    renderTrivy();
  }

  // ---------- scheduling ----------
  let order = [];
  function nextEvent() {
    if (!order.length) order = EVENTS.slice().sort(() => Math.random() - 0.5);
    return order.pop();
  }

  let feedTimer = null;
  let logTimer = null;
  function scheduleFeed(delay) {
    clearTimeout(feedTimer);
    feedTimer = setTimeout(() => {
      post(nextEvent());
      scheduleFeed(9000 + Math.random() * 6000);
    }, delay);
  }
  function scheduleLog() {
    clearTimeout(logTimer);
    logTimer = setTimeout(() => {
      if (!muted && !document.hidden) logLine(AMBIENT[Math.floor(Math.random() * AMBIENT.length)]);
      scheduleLog();
    }, 2600 + Math.random() * 2400);
  }

  function start() {
    scheduleFeed(18000); // after the intro and the falco welcome thread
    // The welcome waits until the tab is actually seen (links often get opened in a background tab).
    const welcome = () => {
      if (document.hidden) { document.addEventListener("visibilitychange", welcome, { once: true }); return; }
      setTimeout(() => post(FIRST), 2500);
    };
    setTimeout(welcome, 5500);
    scheduleLog();

    renderPods();
    renderCron();
    renderTrivy();
    setInterval(tickCron, 1000);
    setInterval(tickTrivy, 700);
    (function podLoop() {
      setTimeout(() => {
        const running = PODS.filter((p) => p.status === "Running");
        if (active() && running.length) heal(running[Math.floor(Math.random() * running.length)]);
        podLoop();
      }, 7000 + Math.random() * 5000);
    })();
  }

  // Bigger moments from terminal.js: chaos, a captured flag, a terraform apply.
  const ON_EVENT = {
    chaos: { bot: "kube", ch: "k8s-events", level: "bad", text: "🐒 chaos-monkey killed `terminal-0` · CrashLoopBackOff",
      log: "WARN terminal-0 CrashLoopBackOff",
      then: { delay: 4200, level: "ok", text: "✅ `terminal-0` restarted · self-healed, no human paged", react: "🩹 1", log: "INFO terminal-0 Ready" } },
    flag: { bot: "falco", ch: "security", level: "ok", text: "🏴 Flag captured by `visitor` · nice work", react: "🏆 1", log: "INFO ctf: flag captured" },
    apply: { bot: "tfc", ch: "deploys", level: "ok", text: "🏗 Run applied by `visitor` · `engineer.neven_geci` created", react: "🤝 1", log: "INFO terraform apply: +1 engineer" },
  };
  document.addEventListener("terminal:event", (e) => {
    const ev = ON_EVENT[e.detail];
    if (!ev) return;
    setTimeout(() => post(ev), 300);
    if (e.detail === "chaos") podsChaos();
  });

  document.addEventListener("terminal:command", (e) => {
    const cmd = String(e.detail || "");
    const hit = ON_COMMAND.find(([re]) => re.test(cmd));
    if (hit) setTimeout(() => post(hit[1]), 500);
  });

  // ---------- mute ----------
  function renderMute() {
    muteBtn.setAttribute("aria-pressed", String(muted));
    muteBtn.querySelector(".state").textContent = muted ? "unmute" : "mute";
    muteBtn.querySelector(".bell").textContent = muted ? "🔕" : "🔔";
    document.body.classList.toggle("alerts-muted", muted);
  }
  muteBtn.addEventListener("click", () => {
    muted = !muted;
    store.set("alerts-muted", muted ? "1" : "0");
    if (muted) feed.replaceChildren();
    renderMute();
  });

  renderMute();
  start();
})();
