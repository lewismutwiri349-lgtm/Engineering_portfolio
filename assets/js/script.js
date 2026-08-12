/* =========================================================
   Lewis Mutwiri — Engineering Portfolio
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
    "mechanical-design": { name: "Design & Drafting", icon: "gear", desc: "Translating requirements into manufacturable CAD models, assemblies and engineering drawings." },
    "finite-element-analysis": { name: "Finite Element Analysis (FEA)", icon: "mesh", desc: "Stress, deflection and fatigue simulation to validate designs before they're built." },
    "cfd": { name: "Computational Fluid Dynamics (CFD)", icon: "flow", desc: "Airflow, heat transfer and fluid flow simulation for thermal and aerodynamic performance." },
    "numerical-analysis": { name: "Numerical Analysis", icon: "chart", desc: "Numerical methods and computational tools for solving engineering problems." },
    "thermodynamics": { name: "Thermodynamics", icon: "thermo", desc: "Applying thermodynamic principles to thermal systems and energy analysis." },
    "embedded-systems": { name: "Embedded Systems", icon: "chip", desc: "Microcontroller-based hardware and firmware for sensing, control and connectivity." },
    "control-engineering": { name: "Control Engineering", icon: "sliders", desc: "Feedback control, PID tuning and system dynamics for stable automated behaviour." },
    "cpp": { name: "C++", icon: "code", desc: "Systems and application programming in C++." },
    "matlab": { name: "MATLAB", icon: "fx", desc: "Numerical computing, simulation and data analysis in MATLAB." },
    "research-development": { name: "Research & Development", icon: "bulb", desc: "Early-stage concept development, prototyping and applied engineering research." },
  };

  const EXPERTISE_GROUPS = [
    { title: "Engineering Design", skills: ["mechanical-design"] },
    { title: "Engineering Analysis", skills: ["finite-element-analysis", "cfd", "numerical-analysis", "thermodynamics"] },
    { title: "Controls & Mechatronics", skills: ["control-engineering", "embedded-systems", "cpp", "matlab"] },
    { title: "Direction", skills: ["research-development"] },
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
    document.querySelectorAll(".nav-toggle").forEach((el) => el.remove());
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
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
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
    return (
      '<a class="card project-card bracket" href="projects.html?id=' +
      encodeURIComponent(p.id) +
      '">' +
      '<div class="thumb"><img src="' +
      escapeHtml(p.thumbnail || "") +
      '" alt="" loading="lazy" onerror="this.closest(\'.thumb\').style.display=\'none\'"></div>' +
      '<div class="meta">' +
      escapeHtml((p.category || "project").toUpperCase()) +
      "</div>" +
      "<h3>" +
      escapeHtml(p.title) +
      "</h3>" +
      "<p>" +
      escapeHtml(p.summary || "") +
      "</p>" +
      '<div class="tags">' +
      tags +
      "</div>" +
      "</a>"
    );
  }

  /* Filters out anything in projects.json that isn't actually a
     project — e.g. a certificate/achievement entry (has an "issuer"
     field) that shouldn't be there but is, so it doesn't render as
     a broken-looking project card. */
  function isRealProject(p) {
    return p && !p.issuer;
  }

  /* ---------------------------------------------------------
     Home page: Robotics projects (the lead showcase) and a
     quiet preview of the Engineering Design Archive. Split is
     driven by each project's explicit "robotics" boolean in
     projects.json, not guessed from category strings.
     --------------------------------------------------------- */
  async function renderRoboticsProjects() {
    const el = document.getElementById("roboticsProjects");
    if (!el) return;
    skeletons(el, 3);
    try {
      const projects = (await loadProjects()).filter(isRealProject);
      const robotics = projects.filter((p) => p.robotics);
      el.innerHTML = robotics.length
        ? robotics.map(projectCardHTML).join("")
        : '<div class="empty-state">Robotics-specific project write-ups are on the way — the skill set above is the current evidence.</div>';
    } catch (e) {
      errorState(el, "Couldn't load projects right now — " + e.message);
    }
  }

  async function renderArchivePreview() {
    const el = document.getElementById("archivePreview");
    if (!el) return;
    skeletons(el, 3);
    try {
      const projects = (await loadProjects()).filter(isRealProject);
      const archive = projects.filter((p) => !p.robotics).slice(0, 3);
      el.innerHTML = archive.length
        ? archive.map(projectCardHTML).join("")
        : '<div class="empty-state">Nothing here yet.</div>';
    } catch (e) {
      errorState(el, "Couldn't load projects right now — " + e.message);
    }
  }

  /* ---------------------------------------------------------
     Portfolio page: full list with search + category filter
     + expertise (skill) filter — all instant, client-side
     --------------------------------------------------------- */
  async function renderPortfolio() {
    const el = document.getElementById("portfolioProjects");
    const searchBox = document.getElementById("searchBox");
    if (!el) return;
    skeletons(el, 6);

    let all = [];
    try {
      all = await loadProjects();
    } catch (e) {
      errorState(el, "Couldn't load projects right now — " + e.message);
      return;
    }

    const categories = Array.from(new Set(all.map((p) => p.category))).sort();
    // Only offer skill filters for skills that actually have at least one
    // project tagged — keeps the chip row honest as the JSON grows.
    const skillsPresent = Array.from(
      new Set(all.flatMap((p) => p.skills || []))
    ).sort((a, b) => (SKILLS[a]?.name || a).localeCompare(SKILLS[b]?.name || b));

    const params = new URLSearchParams(location.search);
    let activeCategory = "all";
    let activeSkill = params.get("skill") && skillsPresent.includes(params.get("skill"))
      ? params.get("skill")
      : null;

    // ---- category filter row ----
    const categoryBar = document.createElement("div");
    categoryBar.className = "filter-bar";
    categoryBar.setAttribute("role", "group");
    categoryBar.setAttribute("aria-label", "Filter projects by category");

    const allBtn = document.createElement("button");
    allBtn.textContent = "All";
    allBtn.setAttribute("aria-pressed", activeCategory === "all" ? "true" : "false");
    allBtn.addEventListener("click", () => {
      activeCategory = "all";
      [...categoryBar.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
      allBtn.setAttribute("aria-pressed", "true");
      apply();
    });
    categoryBar.appendChild(allBtn);

    const categoryLabel = document.createElement("span");
    categoryLabel.className = "filter-label";
    categoryLabel.textContent = "Category";
    categoryBar.prepend(categoryLabel);

    categories.forEach((cat) => {
      const b = document.createElement("button");
      b.textContent = cat.toUpperCase();
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        activeCategory = cat;
        [...categoryBar.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        apply();
      });
      categoryBar.appendChild(b);
    });

    // ---- expertise (skill) filter row ----
    const skillBar = document.createElement("div");
    skillBar.className = "filter-bar filter-bar--skill";
    skillBar.setAttribute("role", "group");
    skillBar.setAttribute("aria-label", "Filter projects by expertise");

    const skillAllBtn = document.createElement("button");
    skillAllBtn.textContent = "All Expertise";
    skillAllBtn.setAttribute("aria-pressed", activeSkill ? "false" : "true");
    skillAllBtn.addEventListener("click", () => {
      activeSkill = null;
      syncSkillUrl();
      [...skillBar.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
      skillAllBtn.setAttribute("aria-pressed", "true");
      apply();
    });
    skillBar.appendChild(skillAllBtn);

    const skillLabel = document.createElement("span");
    skillLabel.className = "filter-label";
    skillLabel.textContent = "Expertise";
    skillBar.prepend(skillLabel);

    skillsPresent.forEach((slug) => {
      const label = SKILLS[slug]?.name || slug;
      const b = document.createElement("button");
      b.textContent = label;
      b.setAttribute("aria-pressed", activeSkill === slug ? "true" : "false");
      b.addEventListener("click", () => {
        activeSkill = slug;
        syncSkillUrl();
        [...skillBar.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        apply();
      });
      skillBar.appendChild(b);
    });

    if (activeSkill) {
      [...skillBar.children].forEach((c) =>
        c.setAttribute("aria-pressed", c.textContent === (SKILLS[activeSkill]?.name || activeSkill) ? "true" : "false")
      );
    }

    function syncSkillUrl() {
      const url = new URL(location.href);
      if (activeSkill) url.searchParams.set("skill", activeSkill);
      else url.searchParams.delete("skill");
      history.replaceState(null, "", url);
    }

    el.insertAdjacentElement("beforebegin", categoryBar);
    el.insertAdjacentElement("beforebegin", skillBar);

    function apply() {
      const q = (searchBox && searchBox.value ? searchBox.value : "").trim().toLowerCase();
      const filtered = all.filter((p) => {
        const matchesCategory = activeCategory === "all" || p.category === activeCategory;
        if (!matchesCategory) return false;
        const matchesSkill = !activeSkill || (p.skills || []).includes(activeSkill);
        if (!matchesSkill) return false;
        if (!q) return true;
        const haystack = [
          p.title,
          p.summary,
          p.category,
          ...(p.tags || []),
          ...(p.software || []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });

      if (!filtered.length && activeSkill) {
        const name = SKILLS[activeSkill]?.name || activeSkill;
        el.innerHTML =
          '<div class="empty-state">No projects tagged with <strong>' +
          escapeHtml(name) +
          "</strong> yet — new work gets added to <code>projects.json</code> as it's finished, so check back soon.</div>";
        return;
      }
      el.innerHTML = filtered.length
        ? filtered.map(projectCardHTML).join("")
        : '<div class="empty-state">No projects match your search. Try a different term.</div>';
    }

    if (searchBox) {
      searchBox.addEventListener("input", debounce(apply, 150));
    }
    apply();
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

    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id) {
      titleEl.textContent = "No project specified";
      document.getElementById("projectDescription").textContent =
        "Open this page from a project card in the portfolio to see its details.";
      return;
    }

    try {
      const projects = await loadProjects();
      const p = projects.find((proj) => proj.id === id);
      if (!p) {
        titleEl.textContent = "Project not found";
        document.getElementById("projectDescription").textContent =
          "That project doesn't exist or may have moved.";
        return;
      }

      document.title = p.title + " | Lewis Mutwiri";
      titleEl.textContent = p.title;
      setText("projectDescription", p.summary || "");
      setImage("projectImage", p.thumbnail, p.title);
      setTags("projectTags", p.tags);
      setChips("softwareList", p.software);
      setChips("engineeringProcess", p.process);
      setText("problem", p.problem || "Not documented yet.");
      setText("solution", p.solution || "Not documented yet.");
      setGallery("projectGallery", p.gallery && p.gallery.length ? p.gallery : [p.thumbnail]);
      setLinks("downloadButtons", p.downloads, "Download");
      setLinks("projectLinks", p.links, "View");
    } catch (e) {
      titleEl.textContent = "Couldn't load this project";
      document.getElementById("projectDescription").textContent = e.message;
    }
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
      '<div class="hero-media" role="img" aria-label="A bird glides through a dawn sky carrying twigs — a symbol of building something new."></div>' +
      '<div class="hero-content">' +
      '<p class="eyebrow">The engineer behind the systems</p>' +
      '<h1>About Me</h1>' +
      '<h2>Robotics Design Engineer</h2>' +
      '<p>I\'m a Mechanical Engineering student shaping robotic and autonomous systems through mechanical design, engineering analysis, and control systems. My work bridges CAD-driven mechanical design with practical mechatronics and system reliability.</p>' +
      '</div>' +
      '</section>' +
      '<section class="section">' +
      '<div class="container">' +
      '<p class="eyebrow">Academics</p>' +
      '<h2 class="section-title">Education</h2>' +
      '<div class="cards">' +
      '<div class="card">' +
      '<h3>BSc Mechanical Engineering</h3>' +
      '<p>South Eastern Kenya University — R&amp;D track, third year.</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>' +
      '<section class="section">' +
      '<div class="container">' +
      '<p class="eyebrow">Tools I use across robotics work</p>' +
      '<h2 class="section-title">Software</h2>' +
      '<div class="tech-grid">' +
      '<span>SolidWorks</span>' +
      '<span>DFMA</span>' +
      '<span>FEA</span>' +
      '<span>CFD</span>' +
      '<span>Control Systems</span>' +
      '<span>ANSYS</span>' +
      '<span>Python</span>' +
      '<span>C++</span>' +
      '<span>Arduino IDE</span>' +
      '<span>MATLAB</span>' +
      '<span>Git</span>' +
      '</div>' +
      '</div>' +
      '</section>' +
      '<section class="section">' +
      '<div class="container">' +
      '<p class="eyebrow">Where my focus goes</p>' +
      '<h2 class="section-title">Robotics Engineering Skill Set</h2>' +
      '<p style="max-width:640px;">These aren\'t separate specialties — they\'re the parts that come together in robotics: designing the mechanism, analyzing whether it holds up, and controlling how it moves. Click through to see the projects behind each one.</p>' +
      '<div id="expertiseGrid" class="expertise-grid" aria-live="polite"></div>' +
      '</div>' +
      '</section>'
    );
  }

  /* ---------------------------------------------------------
     Engineering Expertise grid (About page) — built entirely
     from EXPERTISE_GROUPS + SKILLS above, with live project
     counts pulled from projects.json. Each card links to its
     own filtered view on the portfolio page. Add a project's
     skills[] tag and its count updates everywhere automatically.
     --------------------------------------------------------- */
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
              '<a class="expertise-card bracket" href="portfolio.html?skill=' +
              encodeURIComponent(slug) +
              '" data-skill="' + slug + '">' +
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

    renderRoboticsProjects();
    renderArchivePreview();
    // Per-discipline project grids (#cadProjects, #dfmaProjects, #feaProjects,
    // #cfdProjects, #eacgProjects, #controlProjects, #roboticsProjects) are
    // owned entirely by projects.js on the pages that load it — script.js
    // only handles the homepage's featured strip, the full portfolio grid,
    // and the single-project detail page below.
    renderPortfolio();
    renderProjectDetail();
    renderSharedAbout();
  });
})();
