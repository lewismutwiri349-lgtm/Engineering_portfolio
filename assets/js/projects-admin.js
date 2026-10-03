/* ==========================================================
   PROJECTS ADMIN
   Loads projects.json (fetch when hosted, file picker / paste
   box as fallbacks), lets you create / edit / publish / delete
   projects through a form, manage images and videos per
   project, and commits everything to GitHub via GitHubSync
   (see github-sync.js + project-store.js).

   Data model (additive — old projects keep working):
     published        false hides a project from the public site
                      (missing = published)
     objective, mathModel, controlSystem   new optional text fields
     gallery          [path]            images (unchanged)
     galleryCaptions  {path: caption}   new
     videos           [{url,title,caption,poster}]   new
                      url = uploaded file path OR YouTube/Vimeo/
                      direct link

   Editor-only state is kept in keys starting with "_" and is
   never saved (ProjectStore.stripInternal removes it).
========================================================== */

(function () {
  "use strict";

  const PROJECTS_URL = "projects.json";
  const DRAFT_KEY = "portfolio-projects-draft";

  const MAX_VIDEO_MB = 24;   // Cloudflare Pages rejects files over 25 MiB
  const MAX_IMAGE_MB = 10;
  const VIDEO_TYPES = /\.(mp4|m4v|webm)$/i;
  const IMAGE_TYPES = /\.(webp|png|jpe?g)$/i;

  const CATEGORY_GROUPS = [
    { label: "Computational engineering", options: [
      ["multiphysics", "Multiphysics Simulation"], ["fea", "FEA"], ["cfd", "CFD"],
      ["control-systems", "Control Systems"], ["heat-transfer", "Heat Transfer"],
      ["fluid-mechanics", "Fluid Mechanics"], ["dynamic-systems", "Dynamic Systems"],
      ["numerical-analysis", "Numerical Analysis"], ["digital-twins", "Digital Twins"],
      ["robotics", "Robotics / Autonomous Systems"], ["other", "Other"]
    ]}
  ];

  const STATUS_OPTIONS = [
    "Upcoming", "Planned", "In Progress", "Research", "Design",
    "Simulation", "Prototyping", "Completed", "Archived"
  ];

  const DOMAIN_OPTIONS = [
    { value: "mechanical-machine-design", label: "Core portfolio (default)" },
    { value: "old-projects", label: "Old Projects (archive)" },
    { value: "hobbies", label: "Hobbies (archive)" }
  ];

  // Slugs match SKILLS in script.js
  const SKILL_OPTIONS = [
    "multiphysics-simulation", "physics-based-modelling", "finite-element-analysis", "cfd",
    "numerical-analysis", "thermodynamics", "dynamic-systems", "control-engineering",
    "digital-twins", "embedded-systems", "matlab", "cpp", "research-development"
  ];

  let projects = [];

  /* ---------------------------------------------------------
     Small helpers
     --------------------------------------------------------- */
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function uid() { return "p" + Math.random().toString(36).slice(2, 9); }

  function slugify(text) {
    return (text || "").toString().trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function linesToArray(text) {
    return (text || "").split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
  }

  function pairsToArray(text) {
    return (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
      const [label, url] = line.split("|").map((s) => (s || "").trim());
      return url ? { label: label || "", url } : null;
    }).filter(Boolean);
  }

  function arrayToPairs(arr) {
    return (arr || []).map((i) => `${i.label || ""} | ${i.url || ""}`).join("\n");
  }

  function sanitizeSkills(skills) { return Array.isArray(skills) ? skills : []; }

  function blankProject() {
    return {
      _key: uid(), _path: null, _open: true, _autoSlug: true,
      _files: {}, _preview: {}, _deleteQueue: [],
      id: "", title: "", category: "multiphysics", subcategory: "",
      applicationDomain: "mechanical-machine-design", status: "In Progress",
      date: "", featured: false, published: false, thumbnail: "",
      summary: "", tags: [], software: [], process: [],
      problem: "", objective: "", mathModel: "", simulation: "", controlSystem: "",
      results: "", analysis: "", conclusion: "", requirements: "", approach: "",
      gallery: [], galleryCaptions: {}, videos: [], links: [], downloads: [], skills: []
    };
  }

  /** Turns a raw project object (from JSON) into an editable one. */
  function hydrate(raw) {
    const p = Object.assign(blankProject(), raw);
    p._key = uid();
    p._path = raw._path || null;
    p._open = false;
    p._autoSlug = !raw.id;
    p._files = {}; p._preview = {}; p._deleteQueue = [];
    p.published = raw.published !== false;           // old projects stay published
    p.skills = sanitizeSkills(p.skills);
    p.status = p.status || "Planned";
    p.approach = p.approach || p.solution || "";
    p.gallery = Array.isArray(p.gallery) ? p.gallery : [];
    p.galleryCaptions = (p.galleryCaptions && typeof p.galleryCaptions === "object") ? p.galleryCaptions : {};
    p.videos = Array.isArray(p.videos) ? p.videos : [];
    return p;
  }

  function findProject(key) { return projects.find((p) => p._key === key); }

  /* ---------------------------------------------------------
     Import / load
     --------------------------------------------------------- */
  function initImport() {
    const input = document.getElementById("projectImportInput");
    if (!input) return;

    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;

      const status = document.getElementById("projectAdminStatus");
      let added = 0, replaced = 0;
      const failed = [];

      for (const file of files) {
        let parsed;
        try { parsed = JSON.parse(await file.text()); }
        catch (e) { failed.push(`${file.name}: invalid JSON (${e.message})`); continue; }

        for (const raw of (Array.isArray(parsed) ? parsed : [parsed])) {
          if (!raw || typeof raw !== "object") { failed.push(`${file.name}: skipped a non-object entry`); continue; }
          if (!raw.title && !raw.id) { failed.push(`${file.name}: skipped an entry with no title or id`); continue; }

          const project = hydrate(raw);
          project.id = raw.id ? String(raw.id) : slugify(raw.title);
          const idx = projects.findIndex((p) => p.id && p.id.toLowerCase() === project.id.toLowerCase());
          if (idx !== -1) { project._key = projects[idx]._key; projects[idx] = project; replaced++; }
          else { projects.push(project); added++; }
        }
      }

      renderList();
      input.value = "";
      const parts = [];
      if (added) parts.push(`${added} added`);
      if (replaced) parts.push(`${replaced} replaced (matching ID)`);
      if (failed.length) parts.push(`${failed.length} skipped`);
      status.dataset.state = failed.length ? "error" : "success";
      status.textContent = parts.length
        ? `Import done: ${parts.join(", ")}.${failed.length ? " Issues: " + failed.join("; ") : ""}`
        : "Nothing importable was found in that file.";
    });
  }

  function setProjects(data) {
    projects = (Array.isArray(data) ? data : []).map(hydrate);
    renderList();
  }

  async function loadFromFetch() {
    const status = document.getElementById("projectsLoadStatus");
    try {
      const res = await fetch(PROJECTS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProjects(await res.json());
      status.textContent = `Loaded ${projects.length} project${projects.length === 1 ? "" : "s"} from projects.json.`;
    } catch (err) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          setProjects(JSON.parse(draft));
          status.textContent = `Couldn't fetch projects.json directly (${err.message}). Restored your last saved draft from this browser instead.`;
          return;
        } catch (e) { /* fall through */ }
      }
      status.textContent = `Couldn't fetch projects.json directly (${err.message}). If you're opening this file locally, use "Load index" or "Paste JSON" below.`;
    }
  }

  function initLoadPanel() {
    const fileInput = document.getElementById("projectsFileInput");
    const pasteToggle = document.getElementById("projectsPasteToggle");
    const pasteArea = document.getElementById("projectsPasteArea");
    const pasteLoad = document.getElementById("projectsPasteLoad");
    const status = document.getElementById("projectsLoadStatus");

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          setProjects(JSON.parse(reader.result));
          status.textContent = `Loaded ${projects.length} project${projects.length === 1 ? "" : "s"} from ${file.name}.`;
        } catch (e) { status.textContent = `That file isn't valid JSON: ${e.message}`; }
      };
      reader.readAsText(file);
    });

    pasteToggle.addEventListener("click", () => {
      const hidden = pasteArea.hidden;
      pasteArea.hidden = !hidden;
      pasteLoad.hidden = !hidden;
      pasteToggle.textContent = hidden ? "Hide paste box" : "Paste JSON";
    });

    pasteLoad.addEventListener("click", () => {
      try {
        setProjects(JSON.parse(pasteArea.value));
        status.textContent = `Loaded ${projects.length} project${projects.length === 1 ? "" : "s"} from pasted JSON.`;
      } catch (e) { status.textContent = `That doesn't look like valid JSON: ${e.message}`; }
    });
  }

  /* ---------------------------------------------------------
     Rendering
     --------------------------------------------------------- */
  function categorySelect(project) {
    const known = new Set(CATEGORY_GROUPS.flatMap((g) => g.options.map((o) => o[0])));
    const current = project.category || "";
    // keep legacy categories (e.g. "control systems") selectable instead of silently resetting them
    const legacy = current && !known.has(current)
      ? `<optgroup label="Existing value"><option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option></optgroup>` : "";
    return legacy + CATEGORY_GROUPS.map((g) =>
      `<optgroup label="${g.label}">` +
      g.options.map(([v, l]) => `<option value="${v}" ${current === v ? "selected" : ""}>${l}</option>`).join("") +
      "</optgroup>").join("");
  }

  function statusSelect(project) {
    return STATUS_OPTIONS.map((s) => `<option value="${s}" ${project.status === s ? "selected" : ""}>${s}</option>`).join("");
  }

  function domainSelect(project) {
    const current = project.applicationDomain || "mechanical-machine-design";
    return DOMAIN_OPTIONS.map((d) => `<option value="${d.value}" ${current === d.value ? "selected" : ""}>${d.label}</option>`).join("");
  }

  function skillCheckboxes(project) {
    const all = Array.from(new Set([...SKILL_OPTIONS, ...(project.skills || [])]));
    return all.map((s) => {
      const checked = (project.skills || []).includes(s) ? "checked" : "";
      return `<label class="admin-skill"><input type="checkbox" data-field="skills" value="${escapeHtml(s)}" ${checked}> ${escapeHtml(s)}</label>`;
    }).join("");
  }

  function textArea(project, field, label, rows, hint) {
    return `<label class="achievement-form-grid__full">${label}
      <textarea class="achievement-textarea" data-field="${field}" rows="${rows}" placeholder="${escapeHtml(hint || "")}">${escapeHtml(project[field])}</textarea></label>`;
  }

  function previewSrc(project, path) { return (project._preview && project._preview[path]) || path; }

  function pendingBadge(project, path) {
    return project._files && project._files[path] ? `<span class="media-pending">not uploaded yet</span>` : "";
  }

  function imageRows(project) {
    if (!project.gallery.length) return `<p class="media-empty">No images yet. Add geometry, mesh, contour plots, CAD screenshots…</p>`;
    return project.gallery.map((path, i) => `
      <div class="media-row" data-kind="image" data-index="${i}">
        <img class="media-thumb" src="${escapeHtml(previewSrc(project, path))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="media-main">
          <input class="achievement-input" data-media-caption="${i}" value="${escapeHtml(project.galleryCaptions[path] || "")}" placeholder="Caption, e.g. Mesh — 1.2M tetrahedral elements">
          <small><code>${escapeHtml(path)}</code> ${project.thumbnail === path ? '<span class="media-cover">COVER</span>' : ""} ${pendingBadge(project, path)}</small>
        </div>
        <div class="media-actions">
          <button type="button" class="btn-secondary" data-media="cover" title="Use as cover image">★</button>
          <button type="button" class="btn-secondary" data-media="up" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn-secondary" data-media="down" ${i === project.gallery.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn-secondary" data-media="remove" title="Remove">✕</button>
        </div>
      </div>`).join("");
  }

  function videoRows(project) {
    if (!project.videos.length) return `<p class="media-empty">No videos yet. Upload an animation (MP4/WebM, up to ${MAX_VIDEO_MB} MB) or paste a YouTube/Vimeo link.</p>`;
    return project.videos.map((v, i) => {
      const isFile = !/^https?:\/\//i.test(v.url || "");
      const poster = v.poster ? `<img class="media-thumb" src="${escapeHtml(previewSrc(project, v.poster))}" alt="" onerror="this.style.visibility='hidden'">` : `<div class="media-thumb media-thumb--video" aria-hidden="true">▶</div>`;
      return `
      <div class="media-row" data-kind="video" data-index="${i}">
        ${poster}
        <div class="media-main">
          <input class="achievement-input" data-video-field="title" value="${escapeHtml(v.title || "")}" placeholder="Title, e.g. Transient temperature field">
          <input class="achievement-input" data-video-field="caption" value="${escapeHtml(v.caption || "")}" placeholder="Caption (optional)">
          <small>${isFile ? "Uploaded file" : "Link"}: <code>${escapeHtml(v.url)}</code> ${pendingBadge(project, v.url)}</small>
        </div>
        <div class="media-actions">
          <button type="button" class="btn-secondary" data-media="up" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn-secondary" data-media="down" ${i === project.videos.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn-secondary" data-media="remove" title="Remove">✕</button>
        </div>
      </div>`;
    }).join("");
  }

  function mediaManager(project) {
    const k = escapeHtml(project._key);
    return `
      <div class="media-group">
        <div class="media-group__head">
          <h4>Images <em>${project.gallery.length}</em></h4>
          <div>
            <label class="btn-secondary" for="img-up-${k}">+ Add images</label>
            <input id="img-up-${k}" type="file" accept="image/webp,image/png,image/jpeg" multiple class="visually-hidden" data-media-input="image">
          </div>
        </div>
        <p class="media-hint">PNG / JPG are converted to WebP automatically. ★ sets the cover image shown on cards.</p>
        <div class="media-list">${imageRows(project)}</div>
      </div>
      <div class="media-group">
        <div class="media-group__head">
          <h4>Videos <em>${project.videos.length}</em></h4>
          <div>
            <label class="btn-secondary" for="vid-up-${k}">+ Upload video</label>
            <input id="vid-up-${k}" type="file" accept="video/mp4,video/webm,.mp4,.m4v,.webm" class="visually-hidden" data-media-input="video">
          </div>
        </div>
        <p class="media-hint">MP4 (H.264) plays everywhere including phones. Max ${MAX_VIDEO_MB} MB per file — for longer or larger videos, upload to YouTube and paste the link.</p>
        <div class="media-list">${videoRows(project)}</div>
        <div class="media-linkadd">
          <input class="achievement-input" data-video-link placeholder="…or paste a YouTube / Vimeo / direct .mp4 link">
          <button type="button" class="btn-secondary" data-media="add-link">Add link</button>
        </div>
      </div>
      <div class="achievement-admin-status" data-media-status></div>`;
  }

  function pathNoteFor(project) {
    const path = window.ProjectStore ? window.ProjectStore.pathFor(project) : "";
    if (!project._path) return `Not yet saved to GitHub — will be created at <code>${escapeHtml(path)}</code>`;
    return project._path === path
      ? `Saved at <code>${escapeHtml(project._path)}</code>`
      : `Currently at <code>${escapeHtml(project._path)}</code> — will move to <code>${escapeHtml(path)}</code> on next save`;
  }

  function renderItem(project, index) {
    const label = project.title || project.id || `New project`;
    const live = project.published !== false;
    const catLabel = (project.category || "").replace(/-/g, " ");
    const media = `${project.gallery.length} img · ${project.videos.length} vid`;

    const header = `
      <div class="achievement-admin-item__header project-row" data-action="toggle">
        <div class="project-row__title">
          <h3 data-title-label>${escapeHtml(label)}</h3>
          <span class="project-row__meta">${escapeHtml(catLabel)} · ${escapeHtml(project.status || "")} · ${media}</span>
        </div>
        <span class="admin-pill ${live ? "admin-pill--live" : "admin-pill--draft"}">${live ? "PUBLISHED" : "DRAFT"}</span>
        <div class="achievement-admin-item__actions">
          <button type="button" class="btn-secondary" data-action="up" ${index === 0 ? "disabled" : ""} title="Move up">↑</button>
          <button type="button" class="btn-secondary" data-action="down" ${index === projects.length - 1 ? "disabled" : ""} title="Move down">↓</button>
          <button type="button" class="btn-secondary" data-action="toggle">${project._open ? "Close" : "Edit"}</button>
        </div>
      </div>`;

    if (!project._open) {
      return `<div class="achievement-admin-item ${project.featured ? "achievement-admin-item--featured" : ""}" data-key="${project._key}">${header}</div>`;
    }

    return `
      <div class="achievement-admin-item is-open ${project.featured ? "achievement-admin-item--featured" : ""}" data-key="${project._key}">
        ${header}
        <p class="project-admin-path" data-path-note>${pathNoteFor(project)}</p>

        <details class="admin-section" open><summary>1 · Basics</summary>
          <div class="achievement-form-grid">
            <label>Title
              <input class="achievement-input" data-field="title" value="${escapeHtml(project.title)}" placeholder="Thermal Analysis of an Electronic Enclosure">
            </label>
            <label>ID / slug (auto from title)
              <input class="achievement-input" data-field="id" value="${escapeHtml(project.id)}" placeholder="thermal-analysis-enclosure">
            </label>
            <label>Category
              <select class="achievement-select" data-field="category">${categorySelect(project)}</select>
            </label>
            <label>Status
              <select class="achievement-select" data-field="status">${statusSelect(project)}</select>
            </label>
            <label>Date
              <input class="achievement-input" data-field="date" type="date" value="${escapeHtml(project.date || "")}">
            </label>
            <label>Subcategory (becomes a subfolder, optional)
              <input class="achievement-input" data-field="subcategory" value="${escapeHtml(project.subcategory || "")}" placeholder="internal-flow">
            </label>
            <label class="achievement-form-grid__full">Short description (shown on cards)
              <textarea class="achievement-textarea" data-field="summary" rows="2">${escapeHtml(project.summary)}</textarea>
            </label>
            <label class="achievement-checkbox"><input type="checkbox" data-field="published" ${project.published !== false ? "checked" : ""}> Published (visible on the live site)</label>
            <label class="achievement-checkbox"><input type="checkbox" data-field="featured" ${project.featured ? "checked" : ""}> Featured on homepage</label>
          </div>
        </details>

        <details class="admin-section" open><summary>2 · Technical write-up <small>(every section is optional — empty ones are hidden on the site)</small></summary>
          <div class="achievement-form-grid">
            ${textArea(project, "problem", "Overview / problem statement", 4, "What is the engineering problem?")}
            ${textArea(project, "objective", "Engineering objective", 3, "What was being investigated?")}
            ${textArea(project, "mathModel", "Mathematical model — governing equations, assumptions, boundary / initial conditions", 6, "e.g. ρc_p ∂T/∂t + ∇·(−k∇T) = Q   (plain text / Unicode)")}
            ${textArea(project, "simulation", "Simulation method — software, physics interfaces, solver, mesh", 5, "")}
            ${textArea(project, "controlSystem", "Control system — plant → model → controller → response", 5, "Only if the project involves control")}
            ${textArea(project, "results", "Results — quantitative outcomes", 4, "")}
            ${textArea(project, "analysis", "Analysis — what the results mean physically", 4, "")}
            ${textArea(project, "conclusion", "Key findings / conclusion", 3, "")}
          </div>
        </details>

        <details class="admin-section" open><summary>3 · Images &amp; videos</summary>
          <div data-media-root>${mediaManager(project)}</div>
        </details>

        <details class="admin-section" open><summary>4 · Tools, tags &amp; links</summary>
          <div class="achievement-form-grid">
            <label>Software / tools (comma separated)
              <input class="achievement-input" data-field="software" value="${escapeHtml((project.software || []).join(", "))}" placeholder="COMSOL Multiphysics, MATLAB, Python">
            </label>
            <label>Tags (comma separated)
              <input class="achievement-input" data-field="tags" value="${escapeHtml((project.tags || []).join(", "))}" placeholder="Heat Transfer, Transient, PDE">
            </label>
            <label class="achievement-form-grid__full">Links — one per line: Label | https://url
              <textarea class="achievement-textarea" data-field="links" rows="2" placeholder="GitHub | https://github.com/…">${escapeHtml(arrayToPairs(project.links))}</textarea>
            </label>
            <label class="achievement-form-grid__full">Downloads — one per line: Label | path-or-url
              <textarea class="achievement-textarea" data-field="downloads" rows="2">${escapeHtml(arrayToPairs(project.downloads))}</textarea>
            </label>
            <div class="achievement-form-grid__full">
              <span class="admin-subhead">Skills (drives the filters and counts on the site)</span>
              <div class="admin-skill-grid">${skillCheckboxes(project)}</div>
            </div>
          </div>
        </details>

        <details class="admin-section"><summary>5 · Other fields <small>(older / design-oriented projects)</small></summary>
          <div class="achievement-form-grid">
            <label>Application area
              <select class="achievement-select" data-field="applicationDomain">${domainSelect(project)}</select>
            </label>
            <label>Process steps (comma separated)
              <input class="achievement-input" data-field="process" value="${escapeHtml((project.process || []).join(", "))}" placeholder="Modelling, Meshing, Solving, Validation">
            </label>
            <label>Cover image path (set with ★ in the media list)
              <input class="achievement-input" data-field="thumbnail" value="${escapeHtml(project.thumbnail)}">
            </label>
            ${textArea(project, "requirements", "Requirements / design constraints", 3, "")}
            ${textArea(project, "approach", "Design approach / solution", 3, "")}
          </div>
        </details>

        <div class="achievement-item-footer-actions">
          <button type="button" class="btn-accent" data-action="save-remote">Save to GitHub</button>
          <button type="button" class="btn-secondary" data-action="toggle-publish">${project.published !== false ? "Unpublish" : "Publish"} &amp; save</button>
          <button type="button" class="btn-secondary" data-action="duplicate">Duplicate</button>
          <button type="button" class="btn-secondary" data-action="delete">Remove from list</button>
          <button type="button" class="btn-secondary" data-action="delete-remote">Delete from GitHub</button>
          <span class="achievement-admin-status project-admin-item-status" data-item-status></span>
        </div>
      </div>`;
  }

  function renderList() {
    const list = document.getElementById("projectAdminList");
    const count = document.getElementById("projectCount");
    const live = projects.filter((p) => p.published !== false).length;
    count.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"} · ${live} published · ${projects.length - live} draft`;

    if (!projects.length) {
      list.innerHTML = `<div class="achievement-empty"><strong>No projects yet</strong><p>Click "+ New Project" to create your first entry, or load an existing projects.json above.</p></div>`;
      return;
    }
    list.innerHTML = projects.map(renderItem).join("");
  }

  function rerenderMedia(project) {
    const item = document.querySelector(`.achievement-admin-item[data-key="${project._key}"]`);
    const root = item && item.querySelector("[data-media-root]");
    if (root) root.innerHTML = mediaManager(project);
    // keep the collapsed-row summary honest too
    const meta = item && item.querySelector(".project-row__meta");
    if (meta) meta.textContent = `${(project.category || "").replace(/-/g, " ")} · ${project.status || ""} · ${project.gallery.length} img · ${project.videos.length} vid`;
  }

  function setMediaStatus(item, msg, state) {
    const el = item && item.querySelector("[data-media-status]");
    if (!el) return;
    el.textContent = msg || "";
    el.dataset.state = state || "";
  }

  /* ---------------------------------------------------------
     Media handling
     --------------------------------------------------------- */
  function uniquePath(project, path) {
    const taken = new Set([
      ...project.gallery, ...project.videos.map((v) => v.url), ...project.videos.map((v) => v.poster),
      ...Object.keys(project._files || {})
    ]);
    if (!taken.has(path)) return path;
    const dot = path.lastIndexOf(".");
    const base = dot > path.lastIndexOf("/") ? path.slice(0, dot) : path;
    const ext = dot > path.lastIndexOf("/") ? path.slice(dot) : "";
    let n = 2;
    while (taken.has(`${base}-${n}${ext}`)) n++;
    return `${base}-${n}${ext}`;
  }

  /** PNG/JPG -> WebP (the site's image format). Falls back to the original on failure. */
  async function toWebp(file) {
    if (/\.webp$/i.test(file.name) || file.type === "image/webp") return file;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.92));
      if (!blob || blob.type !== "image/webp") return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
    } catch (e) {
      return file;
    }
  }

  /** Grabs a frame near the start of a video as a WebP poster. Resolves null if the browser can't. */
  function makePoster(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      let done = false;
      const finish = (result) => { if (done) return; done = true; URL.revokeObjectURL(url); resolve(result); };
      video.muted = true; video.playsInline = true; video.preload = "metadata";
      video.onerror = () => finish(null);
      video.onloadedmetadata = () => { video.currentTime = Math.min(1, (video.duration || 1) / 4); };
      video.onseeked = () => {
        try {
          const w = Math.min(video.videoWidth, 1280);
          const h = Math.round(video.videoHeight * (w / video.videoWidth));
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(video, 0, 0, w, h);
          canvas.toBlob((blob) => finish(blob ? new File([blob], "poster.webp", { type: "image/webp" }) : null), "image/webp", 0.85);
        } catch (e) { finish(null); }
      };
      setTimeout(() => finish(null), 8000);
      video.src = url;
    });
  }

  async function addImages(project, files, item) {
    const root = window.ProjectStore;
    let added = 0;
    const problems = [];
    for (const original of files) {
      if (!IMAGE_TYPES.test(original.name)) { problems.push(`${original.name}: use WebP, PNG or JPG`); continue; }
      if (original.size > MAX_IMAGE_MB * 1024 * 1024) { problems.push(`${original.name}: over ${MAX_IMAGE_MB} MB`); continue; }
      setMediaStatus(item, `Preparing ${original.name}…`);
      const file = await toWebp(original);
      const path = uniquePath(project, root.assetPathFor(project, file.name));
      project._files[path] = file;
      project._preview[path] = URL.createObjectURL(file);
      project.gallery.push(path);
      if (!project.thumbnail) project.thumbnail = path;
      added++;
    }
    rerenderMedia(project);
    const again = document.querySelector(`.achievement-admin-item[data-key="${project._key}"]`);
    setMediaStatus(again, [added ? `${added} image${added === 1 ? "" : "s"} added — saved to GitHub when you click Save.` : "", ...problems].filter(Boolean).join(" "), problems.length ? "error" : "success");
  }

  async function addVideoFile(project, file, item) {
    const root = window.ProjectStore;
    if (!VIDEO_TYPES.test(file.name)) { setMediaStatus(item, `${file.name}: use MP4 (H.264) or WebM.`, "error"); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setMediaStatus(item, `${file.name} is ${(file.size / 1048576).toFixed(1)} MB — the limit is ${MAX_VIDEO_MB} MB (Cloudflare Pages caps files at 25 MiB). Compress it, or upload to YouTube and paste the link.`, "error");
      return;
    }
    setMediaStatus(item, "Generating poster frame…");
    const path = uniquePath(project, root.videoPathFor(project, file.name));
    project._files[path] = file;
    project._preview[path] = URL.createObjectURL(file);
    const entry = { url: path, title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), caption: "" };

    const poster = await makePoster(file);
    if (poster) {
      const base = file.name.replace(/\.[^.]+$/, "");
      const posterPath = uniquePath(project, root.videoPathFor(project, `${base}-poster.webp`));
      project._files[posterPath] = poster;
      project._preview[posterPath] = URL.createObjectURL(poster);
      entry.poster = posterPath;
    }
    project.videos.push(entry);
    rerenderMedia(project);
    const again = document.querySelector(`.achievement-admin-item[data-key="${project._key}"]`);
    setMediaStatus(again, `Video added${poster ? "" : " (no poster frame — the player will show the first frame)"}. It uploads when you click Save.`, "success");
  }

  function addVideoLink(project, value, item) {
    const parsed = window.PortfolioMedia.parseVideoUrl(value);
    if (!parsed || !/^https?:\/\//i.test(value.trim())) {
      setMediaStatus(item, "That doesn't look like a YouTube, Vimeo or direct .mp4/.webm link.", "error");
      return false;
    }
    project.videos.push({ url: value.trim(), title: "", caption: "" });
    rerenderMedia(project);
    return true;
  }

  function referencedPaths(project) {
    const set = new Set(project.gallery || []);
    if (project.thumbnail) set.add(project.thumbnail);
    (project.videos || []).forEach((v) => { if (v.url) set.add(v.url); if (v.poster) set.add(v.poster); });
    return set;
  }

  function dropMedia(project, path) {
    if (!path) return;
    if (project._files[path]) {
      delete project._files[path];
      if (project._preview[path]) { URL.revokeObjectURL(project._preview[path]); delete project._preview[path]; }
    } else if (window.ProjectStore.isOwnAsset(project, path)) {
      project._deleteQueue.push(path); // only ever files inside this project's own folder
    }
  }

  function handleMediaClick(project, btn, item) {
    const row = btn.closest(".media-row");
    const kind = row && row.dataset.kind;
    const index = row ? Number(row.dataset.index) : -1;
    const action = btn.dataset.media;

    if (action === "add-link") {
      const input = item.querySelector("[data-video-link]");
      if (addVideoLink(project, input.value, item)) {
        const again = document.querySelector(`.achievement-admin-item[data-key="${project._key}"]`);
        setMediaStatus(again, "Video link added. Click Save to publish it.", "success");
      }
      return;
    }
    if (!row) return;
    const list = kind === "image" ? project.gallery : project.videos;

    if (action === "up" && index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
    else if (action === "down" && index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];
    else if (action === "cover" && kind === "image") project.thumbnail = project.gallery[index];
    else if (action === "remove") {
      if (kind === "image") {
        const path = project.gallery[index];
        project.gallery.splice(index, 1);
        delete project.galleryCaptions[path];
        if (project.thumbnail === path) project.thumbnail = project.gallery[0] || "";
        if (!referencedPaths(project).has(path)) dropMedia(project, path);
      } else {
        const v = project.videos[index];
        project.videos.splice(index, 1);
        [v.url, v.poster].forEach((p) => { if (p && !referencedPaths(project).has(p)) dropMedia(project, p); });
      }
    }
    rerenderMedia(project);
  }

  /* ---------------------------------------------------------
     Editing — delegated events so re-rendering never loses listeners
     --------------------------------------------------------- */
  function refreshItemChrome(item, project) {
    const label = item.querySelector("[data-title-label]");
    if (label) label.textContent = project.title || project.id || "New project";
    const note = item.querySelector("[data-path-note]");
    if (note) note.innerHTML = pathNoteFor(project);
  }

  function initListEvents() {
    const list = document.getElementById("projectAdminList");

    list.addEventListener("input", (e) => {
      const item = e.target.closest(".achievement-admin-item");
      if (!item) return;
      const project = findProject(item.dataset.key);
      if (!project) return;

      if (e.target.dataset.mediaCaption !== undefined) {
        const path = project.gallery[Number(e.target.dataset.mediaCaption)];
        if (path) {
          if (e.target.value.trim()) project.galleryCaptions[path] = e.target.value;
          else delete project.galleryCaptions[path];
        }
        return;
      }
      if (e.target.dataset.videoField) {
        const row = e.target.closest(".media-row");
        const v = project.videos[Number(row.dataset.index)];
        if (v) v[e.target.dataset.videoField] = e.target.value;
        return;
      }

      const field = e.target.dataset.field;
      if (!field || field === "skills") return;

      if (field === "tags" || field === "software" || field === "process") project[field] = linesToArray(e.target.value);
      else if (field === "links" || field === "downloads") project[field] = pairsToArray(e.target.value);
      else if (e.target.type === "checkbox") project[field] = e.target.checked;
      else project[field] = e.target.value;

      if (field === "title" && project._autoSlug) {
        project.id = slugify(project.title);
        const idInput = item.querySelector('[data-field="id"]');
        if (idInput) idInput.value = project.id;
      }
      if (field === "id") project._autoSlug = false;
      if (field === "title" || field === "id" || field === "category" || field === "subcategory") refreshItemChrome(item, project);
    });

    list.addEventListener("change", async (e) => {
      const item = e.target.closest(".achievement-admin-item");
      if (!item) return;
      const project = findProject(item.dataset.key);
      if (!project) return;

      if (e.target.dataset.field === "skills") {
        project.skills = Array.from(item.querySelectorAll('input[data-field="skills"]:checked')).map((b) => b.value);
      } else if (e.target.dataset.field === "published") {
        const pill = item.querySelector(".admin-pill");
        if (pill) { pill.textContent = project.published ? "PUBLISHED" : "DRAFT"; pill.className = `admin-pill ${project.published ? "admin-pill--live" : "admin-pill--draft"}`; }
        const btn = item.querySelector('[data-action="toggle-publish"]');
        if (btn) btn.innerHTML = `${project.published ? "Unpublish" : "Publish"} &amp; save`;
      } else if (e.target.dataset.field === "category" || e.target.dataset.field === "status") {
        rerenderMedia(project); // refreshes the row summary line
      } else if (e.target.dataset.mediaInput === "image") {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (files.length) await addImages(project, files, item);
      } else if (e.target.dataset.mediaInput === "video") {
        const file = e.target.files && e.target.files[0];
        e.target.value = "";
        if (file) await addVideoFile(project, file, item);
      }
    });

    list.addEventListener("click", (e) => {
      const mediaBtn = e.target.closest("button[data-media]");
      if (mediaBtn) {
        const item = mediaBtn.closest(".achievement-admin-item");
        const project = findProject(item.dataset.key);
        if (project) handleMediaClick(project, mediaBtn, item);
        return;
      }

      const trigger = e.target.closest("[data-action]");
      if (!trigger) return;
      if (trigger.tagName === "DIV" && e.target.closest("button")) return; // button inside the row handles itself
      const item = trigger.closest(".achievement-admin-item");
      const index = projects.findIndex((p) => p._key === item.dataset.key);
      if (index === -1) return;
      const action = trigger.dataset.action;
      const project = projects[index];

      if (action === "toggle") { project._open = !project._open; renderList(); }
      else if (action === "delete") {
        if (!confirm("Remove this project from the list? This only affects your working copy — if it was already saved to GitHub, use \"Delete from GitHub\" if you want it gone from the repo too.")) return;
        projects.splice(index, 1); renderList();
      } else if (action === "duplicate") {
        const copy = hydrate(JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(project).filter(([k]) => !k.startsWith("_"))))));
        copy.id = project.id + "-copy"; copy.title = project.title + " (copy)"; copy.published = false; copy._open = true; copy._autoSlug = false;
        projects.splice(index + 1, 0, copy); renderList();
      } else if (action === "up" && index > 0) { [projects[index - 1], projects[index]] = [projects[index], projects[index - 1]]; renderList(); }
      else if (action === "down" && index < projects.length - 1) { [projects[index + 1], projects[index]] = [projects[index], projects[index + 1]]; renderList(); }
      else if (action === "save-remote") saveOneToGitHub(project, item.querySelector("[data-item-status]"));
      else if (action === "toggle-publish") {
        project.published = project.published === false;
        saveOneToGitHub(project, item.querySelector("[data-item-status]"), true);
      } else if (action === "delete-remote") deleteOneFromGitHub(project, index, item.querySelector("[data-item-status]"));
    });
  }

  /* ---------------------------------------------------------
     GitHub saving
     --------------------------------------------------------- */
  function requireGitHubModules(statusEl) {
    if (!window.GitHubSync || !window.ProjectStore) {
      const missing = !window.GitHubSync ? "assets/js/github-sync.js" : "assets/js/project-store.js";
      const msg = `GitHub sync isn't available: ${missing} didn't load. Check <script src="${missing}"> is in this page, before assets/js/projects-admin.js.`;
      if (statusEl) { statusEl.dataset.state = "error"; statusEl.textContent = msg; }
      return false;
    }
    return true;
  }

  /** Uploads every media file still waiting in memory, then deletes files the user removed. */
  async function syncMedia(project, statusEl) {
    const needed = referencedPaths(project);
    const pending = Object.entries(project._files).filter(([path]) => needed.has(path));
    let n = 0;
    for (const [path, file] of pending) {
      n++;
      const label = path.split("/").pop();
      const isBig = file.size > 2 * 1024 * 1024;
      statusEl.textContent = `Uploading ${n}/${pending.length}: ${label}…`;
      await window.GitHubSync.commitBinaryFile(
        path, file, `Upload project media: ${project.id}/${label}`,
        isBig ? (f) => { statusEl.textContent = `Uploading ${n}/${pending.length}: ${label} — ${Math.round(f * 100)}%`; } : undefined
      );
      delete project._files[path];
    }
    const stale = Array.from(new Set(project._deleteQueue)).filter((p) => !needed.has(p));
    project._deleteQueue = [];
    for (const path of stale) {
      try { await window.GitHubSync.deleteFile(path, `Remove project media: ${project.id}/${path.split("/").pop()}`); }
      catch (e) { console.warn("[projects-admin] couldn't delete", path, e.message); }
    }
    return pending.length;
  }

  function validateForSave(project) {
    if (!project.id.trim() && project.title.trim()) project.id = slugify(project.title);
    if (!project.id.trim()) return "This project needs a title (or an ID/slug) before it can be saved.";
    return "";
  }

  async function saveOneToGitHub(project, statusEl, rerender) {
    if (!requireGitHubModules(statusEl)) return;
    const problem = validateForSave(project);
    if (problem) { statusEl.dataset.state = "error"; statusEl.textContent = problem; return; }

    statusEl.dataset.state = "";
    statusEl.textContent = "Saving to GitHub…";
    try {
      const uploaded = await syncMedia(project, statusEl);
      statusEl.textContent = "Saving project file…";
      project._path = await window.ProjectStore.saveProject(project, project._path);
      statusEl.textContent = "Rebuilding projects.json…";
      const count = await window.ProjectStore.rebuildIndex(projects);
      statusEl.dataset.state = "success";
      statusEl.textContent = `Saved${uploaded ? ` (${uploaded} media file${uploaded === 1 ? "" : "s"} uploaded)` : ""} — ${project.published !== false ? "live" : "draft, hidden from the site"}. projects.json rebuilt (${count} projects); Cloudflare will redeploy shortly.`;
      const item = document.querySelector(`.achievement-admin-item[data-key="${project._key}"]`);
      const note = item && item.querySelector("[data-path-note]");
      if (note) note.innerHTML = pathNoteFor(project);
      if (rerender) {
        const msg = statusEl.textContent;
        renderList();   // rebuilds the rows (pill + button labels), so restore the confirmation
        const fresh = document.querySelector(`.achievement-admin-item[data-key="${project._key}"] [data-item-status]`);
        if (fresh) { fresh.dataset.state = "success"; fresh.textContent = msg; }
      } else rerenderMedia(project);
    } catch (err) {
      statusEl.dataset.state = "error";
      statusEl.textContent = `Save failed — your edits are still here, nothing was lost. ${err.message}`;
    }
  }

  async function deleteOneFromGitHub(project, index, statusEl) {
    if (!requireGitHubModules(statusEl)) return;
    if (!project._path) {
      statusEl.dataset.state = "error";
      statusEl.textContent = "This project hasn't been saved to GitHub yet, so there's no file to delete there.";
      return;
    }
    if (!confirm(`Delete ${project._path} from GitHub? Media files in the project's own folder are left in place. This stays in your git history.`)) return;

    statusEl.dataset.state = "";
    statusEl.textContent = "Deleting from GitHub…";
    try {
      await window.ProjectStore.deleteProject(project._path, project.id);
      projects.splice(index, 1);
      const count = await window.ProjectStore.rebuildIndex(projects, [project.id]);
      renderList();
      const status = document.getElementById("projectAdminStatus");
      status.dataset.state = "success";
      status.textContent = `Deleted from GitHub. projects.json rebuilt (${count} projects).`;
    } catch (err) {
      statusEl.dataset.state = "error";
      statusEl.textContent = `Delete failed — the project is still in your working list. ${err.message}`;
    }
  }

  function exportProjects() {
    return projects.map((p) => window.ProjectStore ? window.ProjectStore.stripInternal(p)
      : Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith("_"))));
  }

  function initToolbar() {
    document.getElementById("projectAddButton").addEventListener("click", () => {
      projects.forEach((p) => { p._open = false; });
      projects.unshift(blankProject());   // newest first, matching the site's ordering
      renderList();
      const first = document.querySelector('#projectAdminList [data-field="title"]');
      if (first) { first.scrollIntoView({ behavior: "smooth", block: "center" }); first.focus(); }
    });

    document.getElementById("projectSaveButton").addEventListener("click", () => {
      const status = document.getElementById("projectAdminStatus");
      projects.forEach((p) => { if (!p.id.trim() && p.title.trim()) p.id = slugify(p.title); });
      const missing = projects.filter((p) => !p.id.trim());
      if (missing.length) {
        status.dataset.state = "error";
        status.textContent = `${missing.length} project${missing.length === 1 ? "" : "s"} still need a title or ID before exporting.`;
        return;
      }
      const payload = exportProjects();
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "projects.json"; link.click();
      URL.revokeObjectURL(url);
      status.dataset.state = "success";
      status.textContent = `Downloaded projects.json with ${payload.length} project${payload.length === 1 ? "" : "s"}.`;
    });

    document.getElementById("projectPushButton").addEventListener("click", async () => {
      const status = document.getElementById("projectAdminStatus");
      if (!requireGitHubModules(status)) return;
      projects.forEach((p) => { if (!p.id.trim() && p.title.trim()) p.id = slugify(p.title); });
      const missing = projects.filter((p) => !p.id.trim());
      if (missing.length) {
        status.dataset.state = "error";
        status.textContent = `${missing.length} project${missing.length === 1 ? "" : "s"} still need a title or ID before saving.`;
        return;
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(exportProjects()));

      let saved = 0;
      const failed = [];
      for (const project of projects) {
        status.dataset.state = "";
        status.textContent = `Pushing ${saved + failed.length + 1} of ${projects.length}: ${project.id}…`;
        try {
          await syncMedia(project, status);
          project._path = await window.ProjectStore.saveProject(project, project._path);
          saved++;
        } catch (err) { failed.push(`${project.id}: ${err.message}`); }
      }

      status.textContent = "Rebuilding projects.json…";
      try {
        const count = await window.ProjectStore.rebuildIndex(projects);
        status.dataset.state = failed.length ? "error" : "success";
        status.textContent = `Pushed ${saved} project file${saved === 1 ? "" : "s"} and rebuilt projects.json (${count} projects).` +
          (failed.length ? ` ${failed.length} failed: ${failed.join("; ")}` : " Your site will redeploy shortly.");
        renderList();
      } catch (err) {
        status.dataset.state = "error";
        status.textContent = `Saved ${saved} project file${saved === 1 ? "" : "s"}, but rebuilding projects.json failed: ${err.message}. Retry the push to rebuild the index.`;
      }
    });

    document.getElementById("projectLoadGitHubButton")?.addEventListener("click", async () => {
      const status = document.getElementById("projectsLoadStatus");
      if (!requireGitHubModules(status)) return;
      status.textContent = "Reading project files from GitHub…";
      try {
        const { projects: loaded, errors } = await window.ProjectStore.loadAllFromGitHub();
        if (!loaded.length && !errors.length) {
          status.textContent = "No project files found yet — use \"Save to GitHub\" on a project to create the first one.";
          return;
        }
        projects = loaded.map(({ project, path }) => hydrate(Object.assign({}, project, { _path: path })));
        renderList();
        status.dataset.state = errors.length ? "error" : "success";
        status.textContent = `Loaded ${loaded.length} project${loaded.length === 1 ? "" : "s"} from GitHub.` +
          (errors.length ? ` ${errors.length} file(s) had problems: ${errors.join("; ")}` : "");
      } catch (err) {
        status.dataset.state = "error";
        status.textContent = err.message;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("projectAdminList")) return;
    if (!window.GitHubSync) console.error("[projects-admin] window.GitHubSync is undefined — assets/js/github-sync.js did not load.");
    if (!window.ProjectStore) console.error("[projects-admin] window.ProjectStore is undefined — assets/js/project-store.js did not load.");
    if (!window.PortfolioMedia) console.error("[projects-admin] window.PortfolioMedia is undefined — assets/js/media.js did not load.");
    if (window.GitHubSync) window.GitHubSync.initSyncSettings(document.getElementById("ghSyncSettings"));

    initLoadPanel();
    initImport();
    initListEvents();
    initToolbar();
    loadFromFetch();
  });
})();
