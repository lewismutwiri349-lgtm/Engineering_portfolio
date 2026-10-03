/* =========================================================
   Lewis Mutwiri M'itumitu — Engineering Portfolio
   Vanilla JS: navigation, theme, JSON-driven project system,
   search/filter, scroll reveals, contact form handling.
   No frameworks, no build step — kept dependency-free on
   purpose so the site stays fast on Cloudflare Pages.
   ========================================================= */

(function () {
  "use strict";

  const DATA_URL = "projects.json";

  /* ---------------------------------------------------------
     Engineering Expertise — single source of truth.
     Add a new skill here (plus a matching icon) and it appears
     everywhere automatically: the About page expertise grid,
     the portfolio filter chips, and skill-filtered views.
     Tag a project with its slug in projects.json and it starts
     counting toward that skill immediately — no HTML edits.
     --------------------------------------------------------- */
  const ICONS = {
    gear: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1-1.55V4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10a1.7 1.7 0 0 0 1.55 1H20a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1Z"/>',
    cube: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/>',
    car: '<path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM3 17V11l2-5h10l3 5h3v6"/><path d="M9 11h6"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    mold: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8Z"/>',
    mesh: '<path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    flow: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 16h15a3 3 0 1 1-3 3"/><path d="M3 12h7"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-6 3 4 5-8"/>',
    thermo: '<path d="M12 14V4a2 2 0 1 0-4 0v10a4 4 0 1 0 4 0Z"/>',
    robot: '<rect x="5" y="9" width="14" height="10" rx="2"/><path d="M12 9V5M9 5h6"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    sliders: '<path d="M4 6h9M17 6h3M4 18h3M11 18h9"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="18" r="2"/>',
    code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
    fx: '<path d="M5 21c2-6 3-12 5-16h3"/><path d="M6 10h6"/><path d="M14 21l3-7 3 7M15.5 17h3"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/>',
  };

  function iconSVG(key) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[key] || ICONS.gear) +
      "</svg>"
    );
  }

  const SKILLS = {
    "multiphysics-simulation": { name: "Multiphysics Simulation", icon: "layers", desc: "Coupled thermal, fluid, structural and electromechanical models — building and learning with COMSOL and ANSYS." },
    "physics-based-modelling": { name: "Physics-based Modelling", icon: "fx", desc: "Turning a physical system into governing equations, assumptions and boundary conditions before simulating it." },
    "finite-element-analysis": { name: "Finite Element Analysis (FEA)", icon: "mesh", desc: "Stress, deflection, thermal and modal simulation to validate designs before they're built." },
    "cfd": { name: "Computational Fluid Dynamics (CFD)", icon: "flow", desc: "Airflow, heat transfer and fluid flow simulation for thermal and aerodynamic performance." },
    "numerical-analysis": { name: "Numerical Methods", icon: "chart", desc: "Discretisation, solvers and convergence — numerical methods for ODE/PDE engineering problems." },
    "thermodynamics": { name: "Thermodynamics & Heat Transfer", icon: "thermo", desc: "Applying thermodynamic and heat-transfer principles to thermal systems and energy analysis." },
    "dynamic-systems": { name: "Dynamic System Modelling", icon: "chart", desc: "Transfer-function, state-space and ODE models of mechanical, thermal and electromechanical systems." },
    "control-engineering": { name: "Control Systems", icon: "sliders", desc: "Feedback control, PID tuning, stability and response analysis for simulated and physical systems." },
    "digital-twins": { name: "Digital Twins", icon: "cube", desc: "Exploring simulation-driven, physics-informed models that mirror a physical system's behaviour." },
    "embedded-systems": { name: "Embedded Systems", icon: "chip", desc: "Microcontroller-based hardware and firmware for sensing, actuation and closed-loop control." },
    "matlab": { name: "MATLAB & Simulink", icon: "fx", desc: "Numerical computing, system simulation and controller design." },
    "cpp": { name: "C++", icon: "code", desc: "Systems and embedded programming in C++." },
    "research-development": { name: "Research & Development", icon: "bulb", desc: "Early-stage concept development, prototyping and applied engineering research." },
  };

  const EXPERTISE_GROUPS = [
    { title: "Simulation & Modelling", skills: ["multiphysics-simulation", "physics-based-modelling", "finite-element-analysis", "cfd", "numerical-analysis", "thermodynamics"] },
    { title: "Controls & Dynamics", skills: ["control-engineering", "dynamic-systems", "digital-twins", "embedded-systems"] },
    { title: "Tools & Research", skills: ["matlab", "cpp", "research-development"] },
  ];

  /* ---------------------------------------------------------
     Theme toggle (persisted in localStorage, respects OS
     preference on first visit)
     --------------------------------------------------------- */
  function initTheme() {
    const toggle = document.getElementById("themeToggle");
    const root = document.documentElement;
    const stored = localStorage.getItem("lm-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    // "Cockpit" (dark graphite) is the default mood; "Daylight" is the
    // explicit light alternate, matched to the person's OS preference
    // on first visit, then remembered.
    const theme = stored || (prefersLight ? "light" : "dark");

    applyTheme(theme);

    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem("lm-theme", next);
    });

    function applyTheme(t) {
      if (t === "light") {
        root.setAttribute("data-theme", "light");
        if (toggle) { toggle.textContent = "☀️"; toggle.setAttribute("aria-pressed", "true"); }
      } else {
        root.removeAttribute("data-theme");
        if (toggle) { toggle.textContent = "🌙"; toggle.setAttribute("aria-pressed", "false"); }
      }
    }
  }

  /* ---------------------------------------------------------
     Mobile nav: no hamburger — the nav stays visible at all
     times and scrolls horizontally on narrow screens (see
     style.css). Nothing to inject; this is now a no-op kept
     only so any stray .nav-toggle markup never shows.
     --------------------------------------------------------- */
  function initMobileNav() {
    document.querySelectorAll(".navbar").forEach((nav) => {
      const links = nav.querySelector(".nav-links");
      if (!links || nav.querySelector(".nav-toggle")) return;
      const button = document.createElement("button");
      button.className = "nav-toggle";
      button.type = "button";
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", "site-navigation");
      button.setAttribute("aria-label", "Open navigation");
      button.innerHTML = "<span></span><span></span><span></span>";
      links.id = "site-navigation";
      nav.insertBefore(button, links);
      button.addEventListener("click", () => {
        const open = nav.classList.toggle("nav-open");
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      });
      links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        nav.classList.remove("nav-open"); button.setAttribute("aria-expanded", "false"); button.setAttribute("aria-label", "Open navigation");
      }));
    });
  }

  /* ---------------------------------------------------------
     Active nav link (aria-current) based on current filename
     --------------------------------------------------------- */
  function markActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path) a.setAttribute("aria-current", "page");
    });
  }

  /* ---------------------------------------------------------
     Scroll-reveal via IntersectionObserver (progressive
     enhancement — content is fully visible without JS/CSS)
     --------------------------------------------------------- */
  function initReveals() {
    const targets = document.querySelectorAll(".section, .hero-content");
    targets.forEach((el) => el.classList.add("reveal"));

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px 400px 0px" }
    );
    targets.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     Data loading (single fetch, cached in-memory for the page)
     --------------------------------------------------------- */
  let projectsCache = null;
  async function loadProjects() {
    if (projectsCache) return projectsCache;
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Failed to load project data (" + res.status + ")");
    projectsCache = await res.json();
    return projectsCache;
  }

  function skeletons(container, count) {
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const s = document.createElement("div");
      s.className = "skeleton";
      container.appendChild(s);
    }
  }

  function errorState(container, message) {
    container.innerHTML =
      '<div class="empty-state">' + escapeHtml(message) + "</div>";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function projectCardHTML(p) {
    const tags = (p.tags || [])
      .slice(0, 4)
      .map((t) => "<span>" + escapeHtml(t) + "</span>")
      .join("");
    const status = p.status ? '<span class="project-status project-status--' +
      escapeHtml(String(p.status).toLowerCase().replace(/\s+/g, "-")) + '">' +
      escapeHtml(p.status) + "</span>" : "";
    const videos = Array.isArray(p.videos) ? p.videos : [];
    const cover = p.thumbnail || (p.gallery && p.gallery[0]) || (videos.find((v) => v.poster) || {}).poster || "";
    const badge = videos.length ? '<span class="play-badge">▶ ' + videos.length + (videos.length === 1 ? " VIDEO" : " VIDEOS") + "</span>" : "";
    return (
      '<a class="card project-card bracket" href="projects.html?id=' +
      encodeURIComponent(p.id) + '">' +
      '<div class="thumb"><img src="' + escapeHtml(cover).replace(/"/g, "&quot;") +
      '" alt="" loading="lazy" onerror="this.closest(\'.thumb\').style.display=\'none\'">' + badge + '</div>' +
      '<div class="project-card-head"><div class="meta">' +
      escapeHtml((p.category || "project").toUpperCase()) + "</div>" + status + "</div>" +
      "<h3>" + escapeHtml(p.title) + "</h3>" +
      "<p>" + escapeHtml(p.summary || "") + "</p>" +
      '<div class="tags">' + tags + "</div>" +
      "</a>"
    );
  }

  /* Filters out anything in projects.json that isn't actually a
     project — e.g. a certificate/achievement entry (has an "issuer"
     field) that shouldn't be there but is, so it doesn't render as
     a broken-looking project card. */
  function isRealProject(p) {
    return p && !p.issuer && p.published !== false; // published missing = published (old projects)
  }

  /* ---------------------------------------------------------
     Homepage project showcase — unified engineering work.
     Project lifecycle is driven by the status property in
     projects.json; robotics is no longer a primary grouping.
     --------------------------------------------------------- */
  async function renderHomeProjects() {
    const el = document.getElementById("homeProjects");
    if (!el) return;
    skeletons(el, 3);
    try {
      const projects = (await loadProjects()).filter(isRealProject);
      const featured = projects.filter((p) => p.featured).slice(0, 6);
      el.innerHTML = featured.length
        ? featured.map(projectCardHTML).join("")
        : '<div class="empty-state">No featured projects have been published yet.</div>';
    } catch (e) {
      errorState(el, "Couldn't load projects right now — " + e.message);
    }
  }

  async function renderHomeAchievements() {
    const el = document.getElementById("homeAchievements");
    if (!el) return;
    skeletons(el, 3);
    try {
      const res = await fetch("data/achievements.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const list = (Array.isArray(data) ? data : data.achievements || [])
        .filter((a) => a && a.title && a.published !== false)
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || String(b.date || "").localeCompare(String(a.date || "")))
        .slice(0, 3);
      el.innerHTML = list.length ? list.map((a) =>
        '<a class="card" href="achievements.html">' +
        '<div class="meta">' + escapeHtml(String(a.category || "Achievement").toUpperCase()) + "</div>" +
        "<h3>" + escapeHtml(a.title) + "</h3>" +
        "<p>" + escapeHtml([a.organization, formatDate(a.date)].filter(Boolean).join(" · ")) + "</p></a>").join("")
        : '<div class="empty-state">No achievements have been published yet.</div>';
    } catch (e) {
      errorState(el, "Couldn't load achievements right now — " + e.message);
    }
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value.length === 7 ? value + "-01" : value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(d);
  }

  function renderNewsCard(item) {
    return '<article class="card content-card" data-featured="' + (item.featured ? "true" : "false") + '">' +
      (item.image ? '<div class="thumb"><img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title || "") + '" loading="lazy"></div>' : '') +
      '<div class="content-card-meta"><span class="meta">' + escapeHtml(item.category || "News") + '</span>' +
      (item.featured ? '<span class="content-badge">Featured</span>' : '') + '</div>' +
      '<div class="meta">' + escapeHtml(formatDate(item.date)) + '</div>' +
      '<h3>' + escapeHtml(item.title || "Untitled update") + '</h3>' +
      '<p>' + escapeHtml(item.summary || "") + '</p>' +
      (item.content ? '<details class="content-details"><summary>Read full update</summary><div><p>' + escapeHtml(item.content) + '</p></div></details>' : '') +
      '</article>';
  }

  function eventState(item) {
    const raw = String(item.status || "").toLowerCase();
    if (raw) return raw;
    if (!item.date) return "unscheduled";
    const d = new Date(item.date);
    if (Number.isNaN(d.getTime())) return "scheduled";
    const end = item.endDate ? new Date(item.endDate) : d;
    return end >= new Date() ? "upcoming" : "past";
  }

  function renderEventCard(item) {
    const state = eventState(item);
    return '<article class="card content-card event-card" data-event-state="' + escapeHtml(state) + '">' +
      '<div class="content-card-meta"><span class="meta">' + escapeHtml(item.eventType || "Event") + '</span>' +
      '<span class="project-status project-status--' + escapeHtml(state.replace(/\s+/g, "-")) + '">' + escapeHtml(state) + '</span></div>' +
      '<div class="meta">' + escapeHtml(formatDate(item.date)) + (item.time ? ' · ' + escapeHtml(item.time) : '') + '</div>' +
      '<h3>' + escapeHtml(item.title || "Untitled event") + '</h3>' +
      '<p>' + escapeHtml(item.description || "") + '</p>' +
      (item.location ? '<p class="event-location"><strong>Location:</strong> ' + escapeHtml(item.location) + '</p>' : '') +
      (item.url ? '<a class="btn-secondary" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">Event details →</a>' : '') +
      '</article>';
  }

  async function renderNewsEvents() {
    const newsTargets = [document.getElementById("newsGrid"), document.getElementById("homeNews")].filter(Boolean);
    const eventTargets = [document.getElementById("eventsGrid"), document.getElementById("homeEvents")].filter(Boolean);
    if (!newsTargets.length && !eventTargets.length) return;

    let news = [], events = [];
    try {
      const [newsRes, eventsRes] = await Promise.all([fetch("data/news.json"), fetch("data/events.json")]);
      if (!newsRes.ok || !eventsRes.ok) throw new Error("content data could not be loaded");
      news = await newsRes.json();
      events = await eventsRes.json();
    } catch (e) {
      newsTargets.forEach((el) => errorState(el, "Couldn't load updates right now."));
      eventTargets.forEach((el) => errorState(el, "Couldn't load events right now."));
      return;
    }

    news = Array.isArray(news) ? [...news].sort((a,b) => String(b.date || "").localeCompare(String(a.date || ""))) : [];
    events = Array.isArray(events) ? [...events].sort((a,b) => String(a.date || "").localeCompare(String(b.date || ""))) : [];

    newsTargets.forEach((el) => {
      const limit = el.id === "homeNews" ? news.filter(n => n.featured).slice(0, 2) : news;
      const fallback = el.id === "homeNews" ? news.slice(0, 2) : news;
      el.innerHTML = (limit.length ? limit : fallback).map(renderNewsCard).join("") || '<div class="empty-state">No news items published yet.</div>';
    });

    eventTargets.forEach((el) => {
      const upcoming = events.filter(e => eventState(e) === "upcoming");
      const limit = el.id === "homeEvents" ? upcoming.slice(0, 2) : events;
      el.innerHTML = limit.map(renderEventCard).join("") || '<div class="empty-state">No events published yet.</div>';
    });

    const empty = document.getElementById("eventsEmpty");
    if (empty) empty.style.display = events.length ? "none" : "block";
    initContentFilters(news, events);
  }

  function initContentFilters(news, events) {
    const newsGrid = document.getElementById("newsGrid");
    const eventsGrid = document.getElementById("eventsGrid");
    if (newsGrid && !document.getElementById("newsFilterBar")) {
      const bar = document.createElement("div");
      bar.id = "newsFilterBar";
      bar.className = "filter-bar content-filter-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Filter news");
      const categories = ["all", ...new Set(news.map(n => n.category).filter(Boolean))];
      categories.forEach((cat, i) => {
        const b = document.createElement("button");
        b.textContent = cat === "all" ? "All" : cat;
        b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        b.addEventListener("click", () => {
          [...bar.querySelectorAll("button")].forEach(x => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true");
          const filtered = cat === "all" ? news : news.filter(n => n.category === cat);
          newsGrid.innerHTML = filtered.map(renderNewsCard).join("") || '<div class="empty-state">No news items in this category yet.</div>';
        });
        bar.appendChild(b);
      });
      newsGrid.parentElement.insertBefore(bar, newsGrid);
    }
    if (eventsGrid && !document.getElementById("eventFilterBar")) {
      const bar = document.createElement("div");
      bar.id = "eventFilterBar";
      bar.className = "filter-bar content-filter-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Filter events");
      ["all", "upcoming", "past"].forEach((state, i) => {
        const b = document.createElement("button");
        b.textContent = state[0].toUpperCase() + state.slice(1);
        b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        b.addEventListener("click", () => {
          [...bar.querySelectorAll("button")].forEach(x => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true");
          const filtered = state === "all" ? events : events.filter(e => eventState(e) === state);
          eventsGrid.innerHTML = filtered.map(renderEventCard).join("") || '<div class="empty-state">No ' + state + ' events published yet.</div>';
        });
        bar.appendChild(b);
      });
      eventsGrid.parentElement.insertBefore(bar, eventsGrid);
    }
  }

  /* ---------------------------------------------------------
     Portfolio page: full list with search + category filter
     + expertise (skill) filter — all instant, client-side
     --------------------------------------------------------- */

  /* ---------------------------------------------------------
     Portfolio ordering + specialization presentation export
     Core discipline is intentionally fixed across application
     domains: Mechanical & Machine Design.
     --------------------------------------------------------- */
  const CORE_DISCIPLINE = "Multiphysics Simulation & Control Systems";

  const APPLICATION_DOMAINS = {
    "mechanical-machine-design": {
      key: "mechanical-machine-design",
      title: CORE_DISCIPLINE,
      subtitle: "Core Engineering Portfolio",
      description: "Core work: multiphysics simulation, FEA / CFD, control systems and dynamic-system modelling, with supporting mechanical design.",
      filename: "Simulation_Controls_Portfolio.pptx",
      kicker: "CORE PORTFOLIO"
    },
    "old-projects": {
      key: "old-projects",
      title: "Old Projects",
      subtitle: "Archive of previous work",
      description: "Archived work kept separate from the current simulation and controls portfolio.",
      filename: "Old_Projects_Portfolio.pptx",
      kicker: "ARCHIVE"
    }
  };

  function parseProjectDate(value) {
    if (!value) return null;
    const d = new Date(String(value).trim());
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function sortProjectsNewestFirst(items) {
    return [...items].sort((a, b) => {
      const da = parseProjectDate(a.date);
      const db = parseProjectDate(b.date);
      if (da && db) return db - da;
      if (db) return 1;
      if (da) return -1;
      return 0; // preserve existing order when neither project has a usable date
    });
  }

  function projectBelongsToDomain(project, domainKey) {
    if (domainKey === "mechanical-machine-design") {
      return (project.applicationDomain || "mechanical-machine-design") === "mechanical-machine-design";
    }
    return project.applicationDomain === domainKey;
  }

  function specializationCard(domain, count) {
    const hasProjects = count > 0;
    const buttonLabel = hasProjects ? "DOWNLOAD PRESENTATION" : "NO PROJECTS YET";
    return `
      <article class="card specialization-card">
        <div class="meta">${escapeHTMLSafe(domain.kicker)}</div>
        <h3>${escapeHTMLSafe(domain.title)}</h3>
        <p><strong>${escapeHTMLSafe(CORE_DISCIPLINE)}</strong></p>
        <p>${escapeHTMLSafe(domain.description)}</p>
        <div class="tags">
          <span>${count} project${count === 1 ? "" : "s"}</span>
          <span>Latest first</span>
        </div>
        <div class="project-buttons specialization-actions">
          <button type="button"
                  class="btn-primary specialization-download"
                  data-domain="${escapeHTMLSafe(domain.key)}"
                  ${hasProjects ? "" : "disabled"}>
            ${buttonLabel}
          </button>
        </div>
      </article>
    `;
  }

  // Local escape helper for strings used before the older renderer's helper is in scope.
  function escapeHTMLSafe(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
  }

  async function loadSpecializationPanels(allProjects) {
    const wrap = document.getElementById("specializationGrid");
    if (!wrap) return;

    const domains = Object.values(APPLICATION_DOMAINS);
    wrap.innerHTML = domains.map(domain => {
      const count = allProjects.filter(p => projectBelongsToDomain(p, domain.key)).length;
      return specializationCard(domain, count);
    }).join("");

    wrap.querySelectorAll(".specialization-download").forEach(button => {
      button.addEventListener("click", async () => {
        const domain = APPLICATION_DOMAINS[button.dataset.domain];
        const selected = sortProjectsNewestFirst(
          allProjects.filter(p => projectBelongsToDomain(p, domain.key))
        );
        if (!selected.length) return;
        const original = button.textContent;
        button.disabled = true;
        button.textContent = "GENERATING…";
        try {
          await generatePortfolioPresentation(domain, selected);
        } catch (error) {
          console.error(error);
          alert("The PowerPoint could not be generated. Please try again.");
        } finally {
          button.disabled = false;
          button.textContent = original;
        }
      });
    });
  }

  function pptxSafeText(value, fallback = "") {
    return String(value ?? fallback).trim();
  }

  async function imageUrlToDataUri(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (_) {
      return null;
    }
  }

  function addPptxFooter(slide, index, total) {
    slide.addText("LEWIS MUTWIRI  /  MECHANICAL ENGINEERING", {
      x: 0.55, y: 7.05, w: 8.3, h: 0.18,
      fontFace: "Aptos", fontSize: 7, color: "8A96A3",
      margin: 0, bold: true, charSpacing: 0.7
    });
    slide.addText(`${String(index).padStart(2,"0")} / ${String(total).padStart(2,"0")}`, {
      x: 11.75, y: 7.02, w: 1.0, h: 0.2,
      fontFace: "Aptos", fontSize: 7, color: "8A96A3",
      margin: 0, align: "right"
    });
  }

  function addPptxTitle(pptx, slide, kicker, title, subtitle) {
    slide.background = { color: "081018" };
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6, y: 0.6, w: 1.0, h: 0,
      line: { color: "FF9B42", width: 2.5 }
    });
    slide.addText(kicker, {
      x: 0.6, y: 0.78, w: 5.5, h: 0.22,
      fontFace: "Aptos", fontSize: 9, bold: true, color: "FFB86B",
      margin: 0, charSpacing: 1.6
    });
    slide.addText(title, {
      x: 0.6, y: 1.15, w: 11.7, h: 0.65,
      fontFace: "Aptos Display", fontSize: 28, bold: true, color: "F1F5F8",
      margin: 0, breakLine: false
    });
    slide.addText(subtitle, {
      x: 0.62, y: 1.92, w: 10.8, h: 0.45,
      fontFace: "Aptos", fontSize: 12, color: "B8C4CE",
      margin: 0
    });
  }

  async function generatePortfolioPresentation(domain, projects) {
    if (typeof pptxgen === "undefined") {
      throw new Error("PowerPoint library unavailable.");
    }

    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Lewis Mutwiri";
    pptx.subject = `${domain.title} engineering portfolio`;
    pptx.title = `${domain.title} — ${CORE_DISCIPLINE}`;
    pptx.company = "Lewis Mutwiri";
    pptx.lang = "en-US";
    pptx.theme = {
      headFontFace: "Aptos Display",
      bodyFontFace: "Aptos",
      lang: "en-US"
    };
    pptx.defineSlideMaster({
      title: "MASTER",
      background: { color: "081018" },
      objects: [
        { rect: { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: "FF9B42" }, line: { color: "FF9B42" } } }
      ],
      slideNumber: { x: 12.2, y: 7.02, color: "8A96A3", fontFace: "Aptos", fontSize: 7 }
    });

    const total = projects.length + 2;

    // Cover
    let slide = pptx.addSlide("MASTER");
    slide.background = { color: "061018" };
    slide.addShape(pptx.ShapeType.arc, {
      x: 8.2, y: -0.4, w: 5.0, h: 5.0,
      line: { color: "244A5C", transparency: 15, width: 1.2 },
      adjustPoint: 0.25
    });
    slide.addText("MECHANICAL ENGINEER", {
      x: 0.75, y: 1.05, w: 5.8, h: 0.3,
      fontSize: 12, bold: true, color: "FFB86B", charSpacing: 2.2, margin: 0
    });
    slide.addText(domain.title, {
      x: 0.75, y: 1.65, w: 10.9, h: 0.8,
      fontSize: 34, bold: true, color: "F4F7FA", margin: 0
    });
    slide.addText(CORE_DISCIPLINE, {
      x: 0.75, y: 2.65, w: 9.5, h: 0.45,
      fontSize: 17, bold: true, color: "3FD0FF", margin: 0
    });
    slide.addText("Core engineering discipline applied to a specialized domain", {
      x: 0.75, y: 3.2, w: 8.8, h: 0.4,
      fontSize: 12, color: "B8C4CE", margin: 0
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 0.75, y: 4.2, w: 4.0, h: 0,
      line: { color: "FF9B42", width: 1.5 }
    });
    slide.addText(`${projects.length} PROJECT${projects.length === 1 ? "" : "S"}  ·  LATEST FIRST`, {
      x: 0.75, y: 4.45, w: 5.5, h: 0.25,
      fontSize: 9, bold: true, color: "8A96A3", charSpacing: 1.2, margin: 0
    });
    addPptxFooter(slide, 1, total);

    // Engineering focus
    slide = pptx.addSlide("MASTER");
    addPptxTitle(pptx, slide, domain.kicker, "Engineering focus", domain.subtitle);
    slide.addText(CORE_DISCIPLINE, {
      x: 0.7, y: 2.7, w: 5.6, h: 0.5,
      fontSize: 21, bold: true, color: "3FD0FF", margin: 0
    });
    slide.addText("CAD   ·   DFMA   ·   MECHANICS & MATERIALS   ·   FEA   ·   CFD / THERMAL   ·   MANUFACTURING   ·   MECHANISMS", {
      x: 0.72, y: 3.45, w: 11.2, h: 0.7,
      fontSize: 12, bold: true, color: "D9E1E7", margin: 0,
      breakLine: false, fit: "shrink"
    });
    slide.addText(domain.description, {
      x: 0.72, y: 4.45, w: 10.2, h: 0.8,
      fontSize: 13, color: "AAB7C2", margin: 0
    });
    addPptxFooter(slide, 2, total);

    // Projects
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      slide = pptx.addSlide("MASTER");
      slide.background = { color: "F4F6F8" };

      slide.addText(String(i + 1).padStart(2, "0"), {
        x: 0.65, y: 0.48, w: 0.55, h: 0.3,
        fontSize: 11, bold: true, color: "E8823A", margin: 0
      });
      slide.addText(pptxSafeText(p.title, "Untitled Project"), {
        x: 1.35, y: 0.43, w: 8.9, h: 0.55,
        fontSize: 24, bold: true, color: "12202B", margin: 0, fit: "shrink"
      });
      slide.addText([CORE_DISCIPLINE, p.date || "Date not documented", p.status || "Status not documented"].join("  ·  "), {
        x: 1.36, y: 1.03, w: 10.2, h: 0.25,
        fontSize: 8.5, bold: true, color: "61717E", margin: 0, charSpacing: 0.5
      });

      const image = p.thumbnail ? await imageUrlToDataUri(new URL(p.thumbnail, location.href).href) : null;
      if (image) {
        slide.addImage({ data: image, x: 0.7, y: 1.55, w: 5.35, h: 3.0, sizingContain: true });
      } else {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.7, y: 1.55, w: 5.35, h: 3.0,
          fill: { color: "E5E9ED" }, line: { color: "CAD2D9", width: 1 }
        });
        slide.addText("PROJECT IMAGE NOT AVAILABLE", {
          x: 1.2, y: 2.85, w: 4.3, h: 0.25,
          fontSize: 8, bold: true, color: "7A8792", align: "center", margin: 0
        });
      }

      slide.addText("ENGINEERING OBJECTIVE", {
        x: 6.45, y: 1.55, w: 3.5, h: 0.22,
        fontSize: 8, bold: true, color: "E8823A", charSpacing: 1.0, margin: 0
      });
      slide.addText(pptxSafeText(p.summary || p.problem, "No project objective documented."), {
        x: 6.45, y: 1.9, w: 5.7, h: 1.0,
        fontSize: 13, color: "24323D", margin: 0, fit: "shrink"
      });

      slide.addText("ENGINEERING APPROACH", {
        x: 6.45, y: 3.05, w: 3.5, h: 0.22,
        fontSize: 8, bold: true, color: "E8823A", charSpacing: 1.0, margin: 0
      });
      const approach = p.approach || p.solution || "";
      slide.addText(pptxSafeText(approach, "Approach not documented."), {
        x: 6.45, y: 3.38, w: 5.7, h: 1.0,
        fontSize: 12, color: "24323D", margin: 0, fit: "shrink"
      });

      const tags = [...(p.tags || []), ...(p.software || [])].slice(0, 8);
      if (tags.length) {
        slide.addText("TOOLS / EVIDENCE", {
          x: 0.7, y: 4.85, w: 2.5, h: 0.22,
          fontSize: 8, bold: true, color: "E8823A", charSpacing: 1.0, margin: 0
        });
        slide.addText(tags.join("   ·   "), {
          x: 0.7, y: 5.18, w: 11.1, h: 0.45,
          fontSize: 10, color: "465663", margin: 0, fit: "shrink"
        });
      }
      addPptxFooter(slide, i + 3, total);
    }

    slide = pptx.addSlide("MASTER");
    addPptxTitle(pptx, slide, "END OF PORTFOLIO", "Engineering portfolio", `${domain.title} · ${CORE_DISCIPLINE}`);
    slide.addText("Mechanical Engineering → Mechanical & Machine Design → Specialized Application", {
      x: 0.7, y: 2.75, w: 11.0, h: 0.5,
      fontSize: 18, bold: true, color: "3FD0FF", margin: 0, fit: "shrink"
    });
    slide.addText("This presentation is a curated interview portfolio generated from the project library. Detailed case studies remain available on the portfolio website.", {
      x: 0.72, y: 3.55, w: 9.8, h: 0.8,
      fontSize: 13, color: "B8C4CE", margin: 0
    });
    addPptxFooter(slide, total, total);

    await pptx.writeFile({ fileName: domain.filename });
  }

  /**
   * download.html hosts only #specializationGrid (no project library
   * grid on that page), so it needs the specialization/download cards
   * without going through the rest of renderPortfolio(). Pages that
   * already call loadSpecializationPanels() via renderPortfolio() are
   * skipped here to avoid rendering the grid twice.
   */
  async function renderStandaloneSpecialization() {
    const wrap = document.getElementById("specializationGrid");
    if (!wrap || document.getElementById("portfolioProjects")) return;

    let all = [];
    try { all = (await loadProjects()).filter(isRealProject); }
    catch (e) {
      wrap.innerHTML = `<div class="empty-state"><strong>Couldn't load projects right now.</strong><p>${escapeHtml(e.message)}</p></div>`;
      return;
    }
    await loadSpecializationPanels(all);
  }

  async function renderPortfolio() {
    const el = document.getElementById("portfolioProjects");
    const searchBox = document.getElementById("searchBox");
    if (!el) return;
    skeletons(el, 6);

    let all = [];
    try { all = (await loadProjects()).filter(isRealProject); }
    catch (e) { errorState(el, "Couldn't load projects right now — " + e.message); return; }

    // Pages for a single application area (e.g. old-projects.html,
    // old-projects.html) set data-domain-filter on #portfolioProjects so
    // this one rendering system stays reusable instead of duplicating it
    // per page. portfolio.html (the full library) leaves it unset.
    const domainFilter = el.dataset.domainFilter || null;
    if (domainFilter) {
      all = all.filter((p) => projectBelongsToDomain(p, domainFilter));
    }

    await loadSpecializationPanels(all);

    // Single-area pages are focused and low-volume —
    // the Category/Status/Expertise filter chips add clutter without
    // adding value there, so only build them for the full library
    // (portfolio.html, no domainFilter) and the Old Projects archive.
    // One filter row only: CFD | FEA | Control Systems | Multiphysics (library page only).
    const showFilterBars = !domainFilter;

    const requestedFocus = new URLSearchParams(location.search).get("focus");
    const focusValues = FOCUS_GROUPS.map(g => g.key);
    const focusLabel = (k) => (FOCUS_GROUPS.find(g => g.key === k) || {}).label || k;
    let activeFocus = focusValues.includes(requestedFocus) ? requestedFocus : "all";

    function makeFilterBar(label, values, active, formatter, onChange) {
      const bar = document.createElement("div");
      bar.className = "filter-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Filter projects by " + label.toLowerCase());
      const labelEl = document.createElement("span"); labelEl.className = "filter-label"; labelEl.textContent = label; bar.appendChild(labelEl);
      ["all", ...values].forEach((value, index) => {
        const b = document.createElement("button");
        b.textContent = value === "all" ? "All" : formatter(value);
        b.setAttribute("aria-pressed", (active === value) ? "true" : (active === "all" && index === 0 ? "true" : "false"));
        b.addEventListener("click", () => {
          [...bar.querySelectorAll("button")].forEach(x => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true"); onChange(value); apply();
        });
        bar.appendChild(b);
      });
      return bar;
    }

    if (showFilterBars) {
      el.insertAdjacentElement("beforebegin", makeFilterBar("Focus", focusValues, activeFocus, focusLabel, v => activeFocus = v));
    }

    function apply() {
      const q = (searchBox?.value || "").trim().toLowerCase();
      const filtered = all.filter(p => {
        if (activeFocus !== "all" && !focusKeysFor(p).includes(activeFocus)) return false;
        if (!q) return true;
        return [p.title,p.summary,p.category,p.status,p.objective,...(p.tags||[]),...(p.software||[])].join(" ").toLowerCase().includes(q);
      });
      const ordered = sortProjectsNewestFirst(filtered);
      if (ordered.length) {
        el.innerHTML = ordered.map(projectCardHTML).join("");
      } else if (!all.length && domainFilter) {
        const domainLabel = (APPLICATION_DOMAINS[domainFilter] || {}).title || "this application area";
        el.innerHTML = `<div class="empty-state"><strong>No ${escapeHtml(domainLabel)} projects published yet.</strong><p>New work appears here automatically as soon as it's added — the underlying discipline stays ${escapeHtml(CORE_DISCIPLINE)}.</p></div>`;
      } else {
        el.innerHTML = '<div class="empty-state"><strong>No projects match those filters.</strong><p>' + (activeFocus !== "all" && !all.some(p => focusKeysFor(p).includes(activeFocus)) ? escapeHtml(focusLabel(activeFocus)) + " projects are on the way — new work appears here automatically once it's published." : "Try clearing one of the filters or changing the search term.") + "</p></div>";
      }
    }
    if (searchBox) searchBox.addEventListener("input", debounce(apply, 150));
    apply();
  }

  /* Focus filter on the project library: All | Multiphysics | FEA | CFD | Controls | Dynamic Systems | Other.
     A project belongs to a group by its category OR by a matching skills[] tag, so it can
     appear under more than one. Anything matching none lands in "Other". */
  const FOCUS_GROUPS = [
    { key: "cfd", label: "CFD", categories: ["cfd", "fluid-mechanics"], skills: ["cfd"] },
    { key: "fea", label: "FEA", categories: ["fea"], skills: ["finite-element-analysis"] },
    { key: "controls", label: "Control Systems", categories: ["control-systems", "control", "dynamic-systems"], skills: ["control-engineering", "dynamic-systems", "embedded-systems"] },
    { key: "multiphysics", label: "Multiphysics", categories: ["multiphysics", "heat-transfer", "digital-twins"], skills: ["multiphysics-simulation", "physics-based-modelling", "digital-twins"] },
  ];

  function normCategory(c) { return String(c || "").trim().toLowerCase().replace(/[\s_]+/g, "-"); }

  function focusKeysFor(p) {
    const cat = normCategory(p.category);
    const skills = p.skills || [];
    const keys = FOCUS_GROUPS
      .filter((g) => g.categories.includes(cat) || g.skills.some((sk) => skills.includes(sk)))
      .map((g) => g.key);
    return keys;
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /* ---------------------------------------------------------
     Project detail page: projects.html?id=slug
     --------------------------------------------------------- */
  async function renderProjectDetail() {
    const titleEl = document.getElementById("projectTitle");
    if (!titleEl) return;

    const M = window.PortfolioMedia;
    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const safe = (u) => (M ? M.safeUrl(u) : u);

    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id) {
      titleEl.textContent = "No project specified";
      document.getElementById("projectDescription").textContent =
        "Open this page from a project card in the portfolio to see its details.";
      return;
    }

    try {
      const projects = (await loadProjects()).filter(isRealProject); // drafts are never shown
      const p = projects.find((proj) => proj.id === id);
      if (!p) {
        titleEl.textContent = "Project not found";
        document.getElementById("projectDescription").textContent =
          "That project doesn't exist or may have moved.";
        return;
      }

      document.title = p.title + " | Lewis Mutwiri M'itumitu";
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) metaDescription.setAttribute("content", (p.summary || "Engineering project") + " — Lewis Mutwiri.");
      titleEl.textContent = p.title;
      setText("projectDescription", p.summary || "");
      const metaEl = document.getElementById("projectMeta");
      if (metaEl) metaEl.textContent = [String(p.category || "").replace(/-/g, " "), p.date].filter(Boolean).join(" · ");
      const statusEl = document.getElementById("projectStatus");
      if (statusEl) {
        statusEl.textContent = p.status || "Status not documented";
        statusEl.className = "project-status project-status--" + String(p.status || "documented").toLowerCase().replace(/\s+/g, "-");
      }

      /* ---- lead media: first playable video if there is one, otherwise the cover image ---- */
      const videos = (Array.isArray(p.videos) ? p.videos : []).filter((v) => M && M.parseVideoUrl(v.url));
      const hero = document.getElementById("projectHeroMedia");
      const leadVideo = videos[0];
      const heroInner = hero && hero.querySelector(".container");
      if (heroInner) {
        if (leadVideo) {
          heroInner.innerHTML = M.videoHTML(leadVideo);
        } else {
          const cover = p.thumbnail || (p.gallery && p.gallery[0]);
          heroInner.innerHTML = cover
            ? '<img class="project-image" src="' + esc(safe(cover)) + '" alt="' + esc(p.title) + '" decoding="async" onerror="this.closest(\'section\').hidden=true">'
            : "";
        }
        hero.hidden = !heroInner.innerHTML;
      }

      /* ---- tools / process / tags ---- */
      const tools = document.getElementById("projectTools");
      if (tools) {
        const group = (title, items, cls) => (items && items.length)
          ? '<div><h3>' + title + '</h3><div class="' + cls + '">' + items.map((i) => "<span>" + esc(i) + "</span>").join("") + "</div></div>" : "";
        const html = group("Tools", p.software, "tech-grid") + group("Workflow", p.process, "tech-grid") + group("Tags", p.tags, "tag-list");
        tools.innerHTML = html;
        document.getElementById("projectToolsSection").hidden = !html;
      }

      /* ---- case-study sections: each appears only if it has content ---- */
      const SECTIONS = [
        ["Overview", "The problem", p.problem, "text"],
        ["Objective", "What was investigated", p.objective, "text"],
        ["Requirements", "Design constraints", p.requirements, "text"],
        ["Mathematical Model", "Governing equations & assumptions", p.mathModel, "eq"],
        ["Simulation Method", "Software, physics, solver, mesh", p.simulation, "text"],
        ["Design Approach", "How it was built", p.approach || p.solution, "text"],
        ["Results", "Evidence", p.results, "text"],
        ["Analysis", "What the results mean", p.analysis, "text"],
        ["Control System", "Plant → model → controller → response", p.controlSystem, "text"],
        ["Key Findings", "Conclusion", p.conclusion, "text"],
      ];
      const study = document.getElementById("projectCaseStudy");
      if (study) {
        const html = SECTIONS.filter((x) => x[2] && String(x[2]).trim()).map(([title, kicker, body, kind]) =>
          '<section class="case-section"><p class="eyebrow">' + esc(kicker) + "</p><h2>" + esc(title) + "</h2>" +
          (kind === "eq" ? '<pre class="case-eq">' + esc(body) + "</pre>" : '<p class="case-text">' + esc(body) + "</p>") +
          "</section>").join("");
        study.innerHTML = html || '<section class="case-section"><p class="case-text">A detailed write-up for this project hasn\'t been added yet.</p></section>';
      }

      /* ---- media: remaining videos, then every image with its caption ---- */
      const mediaWrap = document.getElementById("projectMedia");
      if (mediaWrap) {
        const captions = p.galleryCaptions || {};
        const images = (p.gallery && p.gallery.length ? p.gallery : []).filter(Boolean);
        const videoHtml = videos.slice(1).map((v) => M.videoHTML(v)).join("");
        const imageHtml = images.map((src, i) =>
          '<figure class="media-figure"><a href="' + esc(safe(src)) + '" target="_blank" rel="noopener">' +
          '<img src="' + esc(safe(src)) + '" alt="' + esc(captions[src] || (p.title + " — image " + (i + 1))) + '" loading="lazy" onerror="this.closest(\'figure\').remove()"></a>' +
          (captions[src] ? "<figcaption>" + esc(captions[src]) + "</figcaption>" : "") + "</figure>").join("");
        mediaWrap.innerHTML =
          (videoHtml ? '<div class="media-videos">' + videoHtml + "</div>" : "") +
          (imageHtml ? '<div class="media-gallery">' + imageHtml + "</div>" : "");
        document.getElementById("projectMediaSection").hidden = !mediaWrap.innerHTML;
      }

      /* ---- repository, links and downloads ---- */
      const linkSection = document.getElementById("projectLinksSection");
      const buttons = document.getElementById("projectLinks");
      if (buttons && linkSection) {
        const entries = [].concat(
          (p.links || []).map((l) => ({ l, cls: "btn-secondary", verb: "View" })),
          (p.downloads || []).map((l) => ({ l, cls: "btn-primary", verb: "Download" }))
        ).filter((x) => x.l && x.l.url && safe(x.l.url));
        buttons.innerHTML = entries.map((x) =>
          '<a class="' + x.cls + '" href="' + esc(safe(x.l.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(x.l.label || x.verb) + "</a>").join("");
        linkSection.hidden = !entries.length;
      }
    } catch (e) {
      titleEl.textContent = "Couldn't load this project";
      document.getElementById("projectDescription").textContent = e.message;
    }
  }

  function setOptionalCaseStudy(textId, sectionId, value) {
    const section = document.getElementById(sectionId);
    const text = document.getElementById(textId);
    if (!section || !text) return;
    if (value) { text.textContent = value; section.hidden = false; }
    else { section.hidden = true; }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function setImage(id, src, alt) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!src) { el.style.display = "none"; return; }
    el.src = src;
    el.alt = alt || "";
    el.loading = "lazy";
    el.onerror = () => (el.style.display = "none");
  }
  function setTags(id, tags) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (tags || []).map((t) => "<span>" + escapeHtml(t) + "</span>").join("");
  }
  function setChips(id, items) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (items || []).map((t) => "<span>" + escapeHtml(t) + "</span>").join("");
  }
  function setGallery(id, images) {
    const el = document.getElementById(id);
    if (!el) return;
    const valid = (images || []).filter(Boolean);
    el.innerHTML = valid
      .map(
        (src) =>
          '<img src="' + escapeHtml(src) + '" alt="" loading="lazy" onerror="this.remove()">'
      )
      .join("");
  }
  function setLinks(id, links, verb) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!links || !links.length) {
      el.innerHTML = '<p class="empty-inline" style="color:var(--text-soft);font-size:.9rem;">Not available for this project.</p>';
      return;
    }
    el.innerHTML = links
      .map(
        (l) =>
          '<a class="btn-secondary" href="' +
          escapeHtml(l.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(l.label || verb) +
          "</a>"
      )
      .join("");
  }

  /* ---------------------------------------------------------
     Contact form — client-side validation only.
     There is no backend wired up yet, so this confirms the
     message locally and hands off to the visitor's email
     client via mailto rather than silently pretending to send.
     --------------------------------------------------------- */
  function initContactForm() {
    const form = document.querySelector(".contact-form");
    if (!form) return;

    const status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("role", "status");
    form.appendChild(status);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const [name, email, subject, message] = form.querySelectorAll("input, textarea");

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        status.dataset.state = "error";
        status.textContent = "Please fill in your name, email and message before sending.";
        return;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) {
        status.dataset.state = "error";
        status.textContent = "That email address doesn't look right — please double-check it.";
        return;
      }

      const to = "lewismutwiri@hotmail.com";
      const subjectLine = encodeURIComponent(subject.value.trim() || "Portfolio enquiry");
      const body = encodeURIComponent(
        `${message.value.trim()}\n\n— ${name.value.trim()} (${email.value.trim()})`
      );
      window.location.href = `mailto:${to}?subject=${subjectLine}&body=${body}`;

      status.dataset.state = "success";
      status.textContent = "Opening your email client to send this message to " + to + "…";
    });
  }

  function buildAboutSectionHTML() {
    return (
      '<section class="hero hero--section">' +
      '<div class="hero-media" role="img" aria-label="Lewis Mutwiri in an engineering environment."></div>' +
      '<div class="hero-content">' +
      '<p class="eyebrow">The engineer behind the work</p>' +
      '<h1>About Me</h1>' +
      '<h2>Multiphysics Simulation &amp; Control Systems</h2>' +
      '<p>I am a Mechanical Engineering student developing toward work that models a physical system, simulates its behaviour, and designs the control that governs it. My projects combine FEA and CFD, dynamic-system modelling and control design, with CAD as a supporting skill.</p>' +
      '</div></section>' +
      '<section class="section"><div class="container">' +
      '<p class="eyebrow">Academics</p><h2 class="section-title">Education</h2>' +
      '<div class="cards"><div class="card"><h3>BSc Mechanical Engineering</h3><p>South Eastern Kenya University — third year.</p></div></div>' +
      '</div></section>' +
      '<section class="section"><div class="container">' +
      '<p class="eyebrow">Core direction</p><h2 class="section-title">Engineering Capabilities</h2>' +
      '<p style="max-width:760px;">The portfolio is organised around the chain physical system → mathematical model → simulation → analysis → controller → validation. Mechanical design supports that chain; it is not the headline.</p>' +
      '<div id="expertiseGrid" class="expertise-grid" aria-live="polite"></div>' +
      '</div></section>' +
      '<section class="section"><div class="container">' +
      '<p class="eyebrow">How the portfolio is organized</p><h2 class="section-title">Mechanical Engineer &middot; Simulation &amp; Controls Focus</h2>' +
      '<p style="max-width:760px;">Simulation and control are the core of the work. Aerospace and marine appear as skills the work is applied to, not as separate portfolios. Old Projects and Hobbies are kept as a clearly separate archive.</p>' +
      '<div class="cards">' +
      '<a class="card" href="old-projects.html"><h3>Old Projects</h3><p>An archive of earlier work, kept separate from current application areas.</p></a>' +
      '<a class="card" href="download.html"><h3>Download Presentation</h3><p>Generate an interview-ready .pptx portfolio.</p></a>' +
      '</div>' +
      '</div></section>' +
      '<section class="section"><div class="container">' +
      '<p class="eyebrow">Software &amp; methods</p><h2 class="section-title">Technical Stack</h2>' +
      '<div class="tech-grid"><span>ANSYS Mechanical</span><span>ANSYS Fluent</span><span>MATLAB</span><span>Simulink</span><span>Python</span><span>SolidWorks</span><span>C/C++</span><span>Arduino</span><span>ESP32</span><span>GD&amp;T</span><span>DFMA</span></div>' +
      '<p style="margin-top:1rem;">Currently learning: COMSOL Multiphysics, ODE / PDE modelling, system identification.</p>' +
      '</div></section>'
    );
  }

  /* ---------------------------------------------------------
     Engineering Expertise grid (About page) — built entirely
     from EXPERTISE_GROUPS + SKILLS above, with live project
     counts pulled from projects.json. Each card links to its
     own filtered view on the portfolio page. Add a project's
     skills[] tag and its count updates everywhere automatically.
     --------------------------------------------------------- */
  function expertiseHref(slug) {
    const g = FOCUS_GROUPS.find((x) => x.skills.includes(slug));
    return g ? "portfolio.html?focus=" + g.key : "portfolio.html";
  }

  async function renderExpertise(el = document.getElementById("expertiseGrid")) {
    if (!el) return;

    el.innerHTML = EXPERTISE_GROUPS.map(
      (group) =>
        '<div class="expertise-group">' +
        "<h3>" + escapeHtml(group.title) + "</h3>" +
        '<div class="expertise-cards">' +
        group.skills
          .map((slug) => {
            const s = SKILLS[slug];
            if (!s) return "";
            return (
              '<a class="expertise-card bracket" href="' + expertiseHref(slug) + '" data-skill="' + slug + '">' +
              '<div class="expertise-icon">' + iconSVG(s.icon) + "</div>" +
              "<h4>" + escapeHtml(s.name) + "</h4>" +
              "<p>" + escapeHtml(s.desc) + "</p>" +
              '<div class="expertise-meta">' +
              '<span class="expertise-count" data-count-for="' + slug + '">…</span>' +
              '<span class="expertise-cta">View Projects →</span>' +
              "</div>" +
              "</a>"
            );
          })
          .join("") +
        "</div></div>"
    ).join("");

    try {
      const projects = await loadProjects();
      const counts = {};
      projects.forEach((p) => (p.skills || []).forEach((slug) => (counts[slug] = (counts[slug] || 0) + 1)));
      el.querySelectorAll("[data-count-for]").forEach((span) => {
        const n = counts[span.dataset.countFor] || 0;
        span.textContent = n === 1 ? "1 Project" : n + " Projects";
      });
    } catch (e) {
      el.querySelectorAll("[data-count-for]").forEach((span) => (span.textContent = "—"));
    }
  }

  async function renderSharedAbout() {
    const container = document.getElementById("aboutPageContent");
    if (container) {
      container.innerHTML = buildAboutSectionHTML();
      await renderExpertise(container.querySelector("#expertiseGrid"));
    }
    // Homepage gets its own lean #expertiseGrid (see index.html) instead
    // of the full About block, so it doesn't duplicate Education/Software.
    if (document.getElementById("expertiseGrid") && !container?.contains(document.getElementById("expertiseGrid"))) {
      await renderExpertise();
    }
  }

  /* ---------------------------------------------------------
     HUD attitude-ring — the site's signature motif, injected
     only into the flagship (non-section) hero, i.e. the
     homepage. Pure decoration: aria-hidden, and inert under
     prefers-reduced-motion via the global CSS media query.
     --------------------------------------------------------- */
  function initHeroHUD() {
    const hero = document.querySelector(".hero:not(.hero--section)");
    if (!hero || hero.querySelector(".hud-ring")) return;

    const wrap = document.createElement("div");
    wrap.className = "hud-ring";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" fill="none">' +
      '<circle cx="200" cy="200" r="180" stroke="rgba(63,208,255,.16)" stroke-width="1"/>' +
      '<circle cx="200" cy="200" r="140" stroke="rgba(63,208,255,.26)" stroke-width="1"/>' +
      '<g class="ring-rotate" stroke="rgba(63,208,255,.5)" stroke-width="1.5">' +
      '<path d="M200 20 L200 45 M200 355 L200 380 M20 200 L45 200 M355 200 L380 200"/>' +
      '<path d="M85 85 L100 100 M300 300 L315 315 M85 315 L100 300 M300 100 L315 85"/>' +
      "</g>" +
      '<g class="ring-rotate-rev" stroke="rgba(255,155,66,.45)" stroke-width="1" stroke-dasharray="2 10">' +
      '<circle cx="200" cy="200" r="160"/>' +
      "</g>" +
      '<g class="horizon-line">' +
      '<line x1="80" y1="200" x2="320" y2="200" stroke="rgba(255,155,66,.65)" stroke-width="1.5"/>' +
      '<circle cx="200" cy="200" r="5" fill="none" stroke="#FF9B42" stroke-width="1.5"/>' +
      '<circle cx="200" cy="200" r="2" fill="#FF9B42"/>' +
      "</g></svg>";
    hero.appendChild(wrap);
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function stampYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initMobileNav();
    initHeroHUD();
    markActiveNav();
    initReveals();
    initContactForm();
    stampYear();

    renderHomeProjects();
    renderHomeAchievements();
    renderNewsEvents();
    // Per-discipline project grids (#cadProjects, #dfmaProjects, #feaProjects,
    // #cfdProjects, #eacgProjects, #controlProjects, #roboticsProjects) are
    // owned entirely by projects.js on the pages that load it — script.js
    // only handles the homepage's featured strip, the full portfolio grid,
    // and the single-project detail page below.
    renderPortfolio();
    renderStandaloneSpecialization();
    renderProjectDetail();
    renderSharedAbout();
  });
})();
