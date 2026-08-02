/* ==========================================================
   PROJECTS ADMIN
   Loads projects.json (via fetch when hosted, or a local file
   picker / paste box as a fallback for file:// testing where
   fetch() is blocked), lets you add/edit/delete/reorder
   entries through a form, and exports an updated projects.json
   for you to drop back into your project folder.

   Nothing here writes to your server — there is no backend.
   This is a browser-only editing surface, matching the same
   pattern as achievements.js / admin.html.
========================================================== */

(function () {
  "use strict";

  const PROJECTS_URL = "projects.json";
  const DRAFT_KEY = "portfolio-projects-draft";

  const CATEGORY_OPTIONS = [
    "cad", "dfma", "fea", "cfd", "eacg", "control-systems", "robotics", "embedded"
  ];

  const SKILL_OPTIONS = [
    "mechanical-design", "machine-design", "industrial-design", "automotive-design",
    "sheet-metal", "injection-mold-design", "design-for-manufacturing",
    "finite-element-analysis", "cfd", "numerical-analysis", "thermodynamics",
    "embedded-systems", "control-engineering", "cpp", "matlab", "research-development"
  ];

  let projects = [];

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  }

  function uid() {
    return "p" + Math.random().toString(36).slice(2, 9);
  }

  function blankProject() {
    return {
      _key: uid(),
      id: "",
      title: "",
      category: "dfma",
      featured: false,
      thumbnail: "",
      summary: "",
      tags: [],
      software: [],
      process: [],
      problem: "",
      solution: "",
      gallery: [],
      links: [],
      downloads: [],
      skills: []
    };
  }

  function linesToArray(text) {
    return (text || "")
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function pairsToArray(text) {
    // one "label | url" per line
    return (text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, url] = line.split("|").map((s) => (s || "").trim());
        return url ? { label: label || "", url } : null;
      })
      .filter(Boolean);
  }

  function arrayToPairs(arr) {
    return (arr || []).map((item) => `${item.label || ""} | ${item.url || ""}`).join("\n");
  }

  function slugify(text) {
    return (text || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* ---------------------------------------------------------
     Import — pick one or more .json files (each holding a
     single project object or an array of them). A project
     whose id matches one already in the list replaces it;
     otherwise it's appended. Simple, predictable, no modal.
     --------------------------------------------------------- */
  function initImport() {
    const input = document.getElementById("projectImportInput");
    if (!input) return;

    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;

      const status = document.getElementById("projectAdminStatus");
      let added = 0, replaced = 0, failed = [];

      for (const file of files) {
        let text;
        try {
          text = await file.text();
        } catch (e) {
          failed.push(`${file.name}: couldn't read file`);
          continue;
        }

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          failed.push(`${file.name}: invalid JSON (${e.message})`);
          continue;
        }

        const incoming = Array.isArray(parsed) ? parsed : [parsed];

        for (const raw of incoming) {
          if (!raw || typeof raw !== "object") {
            failed.push(`${file.name}: skipped an entry that isn't a project object`);
            continue;
          }
          if (!raw.title && !raw.id) {
            failed.push(`${file.name}: skipped an entry with no title or id`);
            continue;
          }

          const project = Object.assign(blankProject(), raw);
          project.id = raw.id ? String(raw.id) : slugify(raw.title);
          project._key = uid();

          const existingIndex = projects.findIndex((p) => p.id && p.id.toLowerCase() === project.id.toLowerCase());
          if (existingIndex !== -1) {
            project._key = projects[existingIndex]._key;
            projects[existingIndex] = project;
            replaced++;
          } else {
            projects.push(project);
            added++;
          }
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

  /* ---------------------------------------------------------
     Loading — try fetch first (works when the site is hosted),
     fall back to a file picker or paste box (works from file://
     where fetch is blocked by CORS)
     --------------------------------------------------------- */
  async function loadFromFetch() {
    const status = document.getElementById("projectsLoadStatus");
    try {
      const res = await fetch(PROJECTS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProjects(data);
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
      status.textContent = `Couldn't fetch projects.json directly (${err.message}). If you're opening this file locally, use "Load a projects.json file" or "Paste JSON instead" below.`;
    }
  }

  function setProjects(data) {
    const arr = Array.isArray(data) ? data : [];
    projects = arr.map((p) => Object.assign({ _key: uid() }, p));
    renderList();
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
        } catch (e) {
          status.textContent = `That file isn't valid JSON: ${e.message}`;
        }
      };
      reader.readAsText(file);
    });

    pasteToggle.addEventListener("click", () => {
      const hidden = pasteArea.hidden;
      pasteArea.hidden = !hidden;
      pasteLoad.hidden = !hidden;
      pasteToggle.textContent = hidden ? "Hide paste box" : "Paste JSON instead";
    });

    pasteLoad.addEventListener("click", () => {
      try {
        setProjects(JSON.parse(pasteArea.value));
        status.textContent = `Loaded ${projects.length} project${projects.length === 1 ? "" : "s"} from pasted JSON.`;
      } catch (e) {
        status.textContent = `That doesn't look like valid JSON: ${e.message}`;
      }
    });
  }

  /* ---------------------------------------------------------
     Rendering — one form block per project
     --------------------------------------------------------- */
  function categorySelect(project) {
    return CATEGORY_OPTIONS
      .map((c) => `<option value="${c}" ${project.category === c ? "selected" : ""}>${c}</option>`)
      .join("");
  }

  function skillCheckboxes(project) {
    return SKILL_OPTIONS
      .map((s) => {
        const checked = (project.skills || []).includes(s) ? "checked" : "";
        return `<label style="display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:.72rem;color:var(--text-soft);text-transform:none;letter-spacing:0;">
          <input type="checkbox" data-field="skills" value="${s}" ${checked}> ${s}
        </label>`;
      })
      .join("");
  }

  function renderItem(project, index) {
    const label = project.title || project.id || `Project ${index + 1}`;
    return `
      <div class="achievement-admin-item ${project.featured ? "achievement-admin-item--featured" : ""}" data-key="${project._key}">
        <div class="achievement-admin-item__header">
          <h3>${escapeHtml(label)}</h3>
          <div class="achievement-admin-item__actions">
            <button type="button" class="btn-secondary" data-action="up" ${index === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn-secondary" data-action="down" ${index === projects.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn-secondary" data-action="duplicate">Duplicate</button>
            <button type="button" class="btn-secondary" data-action="delete">Delete</button>
          </div>
        </div>
        <div class="achievement-form-grid">
          <label>ID / slug
            <input class="achievement-input" data-field="id" value="${escapeHtml(project.id)}" placeholder="pcb-enclosure">
          </label>
          <label>Title
            <input class="achievement-input" data-field="title" value="${escapeHtml(project.title)}" placeholder="PCB Enclosure Design">
          </label>
          <label>Category
            <select class="achievement-select" data-field="category">${categorySelect(project)}</select>
          </label>
          <label class="achievement-checkbox">
            <input type="checkbox" data-field="featured" ${project.featured ? "checked" : ""}> Featured
          </label>
          <label>Thumbnail path
            <input class="achievement-input" data-field="thumbnail" value="${escapeHtml(project.thumbnail)}" placeholder="assets/images/example-cover.jpg">
          </label>
          <label>Tags (comma or one per line)
            <input class="achievement-input" data-field="tags" value="${escapeHtml((project.tags || []).join(", "))}" placeholder="SolidWorks, GD&T">
          </label>
          <label>Software (comma or one per line)
            <input class="achievement-input" data-field="software" value="${escapeHtml((project.software || []).join(", "))}" placeholder="SolidWorks">
          </label>
          <label>Process steps (comma or one per line)
            <input class="achievement-input" data-field="process" value="${escapeHtml((project.process || []).join(", "))}" placeholder="Concept Sketching, Solid Modelling">
          </label>
          <label class="achievement-form-grid__full">Summary
            <textarea class="achievement-textarea" data-field="summary" rows="2">${escapeHtml(project.summary)}</textarea>
          </label>
          <label class="achievement-form-grid__full">Problem
            <textarea class="achievement-textarea" data-field="problem">${escapeHtml(project.problem)}</textarea>
          </label>
          <label class="achievement-form-grid__full">Solution
            <textarea class="achievement-textarea" data-field="solution">${escapeHtml(project.solution)}</textarea>
          </label>
          <label class="achievement-form-grid__full">Gallery image paths (one per line)
            <textarea class="achievement-textarea" data-field="gallery" rows="3">${escapeHtml((project.gallery || []).join("\n"))}</textarea>
          </label>
          <label class="achievement-form-grid__full">Links — one per line, format: Label | https://url
            <textarea class="achievement-textarea" data-field="links" rows="2">${escapeHtml(arrayToPairs(project.links))}</textarea>
          </label>
          <label class="achievement-form-grid__full">Downloads — one per line, format: Label | path-or-url
            <textarea class="achievement-textarea" data-field="downloads" rows="2">${escapeHtml(arrayToPairs(project.downloads))}</textarea>
          </label>
          <div class="achievement-form-grid__full">
            <span style="display:block;font-family:var(--font-mono);font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;color:var(--cyan);margin-bottom:8px;">Skills</span>
            <div style="display:flex;flex-wrap:wrap;gap:10px;">${skillCheckboxes(project)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderList() {
    const list = document.getElementById("projectAdminList");
    const count = document.getElementById("projectCount");
    count.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;

    if (!projects.length) {
      list.innerHTML = `<div class="achievement-empty"><strong>No projects yet</strong><p>Click "Add Project" to create your first entry, or load an existing projects.json above.</p></div>`;
      return;
    }
    list.innerHTML = projects.map(renderItem).join("");
  }

  /* ---------------------------------------------------------
     Editing — delegate all input/change/click events from
     the list so re-rendering never loses listeners
     --------------------------------------------------------- */
  function findProject(key) {
    return projects.find((p) => p._key === key);
  }

  function initListEvents() {
    const list = document.getElementById("projectAdminList");

    list.addEventListener("input", (e) => {
      const item = e.target.closest(".achievement-admin-item");
      if (!item) return;
      const project = findProject(item.dataset.key);
      if (!project) return;
      const field = e.target.dataset.field;
      if (!field) return;

      if (field === "tags" || field === "software" || field === "process") {
        project[field] = linesToArray(e.target.value);
      } else if (field === "gallery") {
        project.gallery = linesToArray(e.target.value);
      } else if (field === "links") {
        project.links = pairsToArray(e.target.value);
      } else if (field === "downloads") {
        project.downloads = pairsToArray(e.target.value);
      } else if (e.target.type === "checkbox" && field === "featured") {
        project.featured = e.target.checked;
      } else {
        project[field] = e.target.value;
      }
    });

    list.addEventListener("change", (e) => {
      const item = e.target.closest(".achievement-admin-item");
      if (!item) return;
      const project = findProject(item.dataset.key);
      if (!project) return;

      if (e.target.dataset.field === "skills") {
        const box = item.querySelectorAll('input[data-field="skills"]:checked');
        project.skills = Array.from(box).map((b) => b.value);
      }
      if (e.target.dataset.field === "category" || e.target.dataset.field === "title") {
        renderList();
      }
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const item = btn.closest(".achievement-admin-item");
      const key = item.dataset.key;
      const index = projects.findIndex((p) => p._key === key);
      if (index === -1) return;

      const action = btn.dataset.action;
      if (action === "delete") {
        if (!confirm("Delete this project? This can't be undone (unless you reload the JSON).")) return;
        projects.splice(index, 1);
      } else if (action === "duplicate") {
        const copy = Object.assign({}, projects[index], { _key: uid(), id: projects[index].id + "-copy" });
        projects.splice(index + 1, 0, copy);
      } else if (action === "up" && index > 0) {
        [projects[index - 1], projects[index]] = [projects[index], projects[index - 1]];
      } else if (action === "down" && index < projects.length - 1) {
        [projects[index + 1], projects[index]] = [projects[index], projects[index + 1]];
      }
      renderList();
    });
  }

  /* ---------------------------------------------------------
     Save — strip internal _key, download projects.json, and
     keep a draft in localStorage so a refresh doesn't lose work
     --------------------------------------------------------- */
  function exportProjects() {
    return projects.map((p) => {
      const clean = Object.assign({}, p);
      delete clean._key;
      return clean;
    });
  }

  function initSave() {
    document.getElementById("projectAddButton").addEventListener("click", () => {
      projects.push(blankProject());
      renderList();
      document.getElementById("projectAdminList").lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    document.getElementById("projectSaveButton").addEventListener("click", () => {
      const status = document.getElementById("projectAdminStatus");
      const missingIds = projects.filter((p) => !p.id.trim());
      if (missingIds.length) {
        status.dataset.state = "error";
        status.textContent = `${missingIds.length} project${missingIds.length === 1 ? "" : "s"} still need an ID/slug before saving.`;
        return;
      }

      const payload = exportProjects();
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "projects.json";
      link.click();
      URL.revokeObjectURL(url);

      status.dataset.state = "success";
      status.textContent = `Downloaded projects.json with ${payload.length} project${payload.length === 1 ? "" : "s"}. Replace the copy in your site folder with this one.`;
    });

    document.getElementById("projectPushButton").addEventListener("click", async () => {
      const status = document.getElementById("projectAdminStatus");
      const missingIds = projects.filter((p) => !p.id.trim());
      if (missingIds.length) {
        status.dataset.state = "error";
        status.textContent = `${missingIds.length} project${missingIds.length === 1 ? "" : "s"} still need an ID/slug before saving.`;
        return;
      }

      const payload = exportProjects();
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));

      status.dataset.state = "";
      status.textContent = "Pushing to GitHub…";
      try {
        await window.GitHubSync.commitFile(
          "projects.json",
          JSON.stringify(payload, null, 2),
          `Update projects.json (${payload.length} project${payload.length === 1 ? "" : "s"})`
        );
        status.dataset.state = "success";
        status.textContent = `Pushed projects.json (${payload.length} project${payload.length === 1 ? "" : "s"}) to GitHub. Your site will redeploy shortly.`;
      } catch (err) {
        status.dataset.state = "error";
        status.textContent = err.message;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("projectAdminList")) return;
    if (window.GitHubSync) window.GitHubSync.initSyncSettings(document.getElementById("ghSyncSettings"));
    initLoadPanel();
    initImport();
    initListEvents();
    initSave();
    loadFromFetch();
  });
})();
