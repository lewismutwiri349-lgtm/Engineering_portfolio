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
    "industrial-robotics", "automotive-robotics", "robotic-systems-design",
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
      _path: null,
      id: "",
      title: "",
      category: "dfma",
      subcategory: "",
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
    const path = window.ProjectStore ? window.ProjectStore.pathFor(project) : "";
    const pathNote = project._path
      ? (project._path === path
          ? `Saved at <code>${escapeHtml(project._path)}</code>`
          : `Currently at <code>${escapeHtml(project._path)}</code> — will move to <code>${escapeHtml(path)}</code> on next save`)
      : `Not yet saved to GitHub — will be created at <code>${escapeHtml(path)}</code>`;

    return `
      <div class="achievement-admin-item ${project.featured ? "achievement-admin-item--featured" : ""}" data-key="${project._key}">
        <div class="achievement-admin-item__header">
          <h3>${escapeHtml(label)}</h3>
          <div class="achievement-admin-item__actions">
            <button type="button" class="btn-secondary" data-action="up" ${index === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn-secondary" data-action="down" ${index === projects.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn-secondary" data-action="duplicate">Duplicate</button>
            <button type="button" class="btn-secondary" data-action="delete">Remove from list</button>
          </div>
        </div>
        <p class="project-admin-path">${pathNote}</p>
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
          <label>Subcategory (becomes a subfolder)
            <input class="achievement-input" data-field="subcategory" value="${escapeHtml(project.subcategory || "")}" placeholder="internal-flow">
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
          <label class="achievement-form-grid__full">
            Upload image assets to GitHub
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:6px;">
              <label class="btn-secondary" for="asset-upload-${escapeHtml(project._key)}">Choose image files</label>
              <input id="asset-upload-${escapeHtml(project._key)}" type="file" accept="image/*" multiple class="visually-hidden" data-field="asset-upload">
              <span class="achievement-admin-status" data-asset-hint></span>
            </div>
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
        <div class="achievement-item-footer-actions">
          <button type="button" class="btn-accent" data-action="save-remote">Save this project to GitHub</button>
          <button type="button" class="btn-secondary" data-action="delete-remote">Delete this project's file from GitHub</button>
          <span class="achievement-admin-status project-admin-item-status" data-item-status></span>
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
      if (e.target.dataset.field === "asset-upload") {
        const hint = item.querySelector('[data-asset-hint]');
        const files = Array.from(e.target.files || []);
        if (hint) {
          hint.textContent = files.length ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : "";
        }
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
        if (!confirm("Remove this project from the list? This only affects your working copy here — if it was already saved to GitHub, use \"Delete this project's file from GitHub\" first if you want it gone from the repo too.")) return;
        projects.splice(index, 1);
        renderList();
        return;
      } else if (action === "duplicate") {
        const copy = Object.assign({}, projects[index], { _key: uid(), _path: null, id: projects[index].id + "-copy" });
        projects.splice(index + 1, 0, copy);
        renderList();
        return;
      } else if (action === "up" && index > 0) {
        [projects[index - 1], projects[index]] = [projects[index], projects[index - 1]];
        renderList();
        return;
      } else if (action === "down" && index < projects.length - 1) {
        [projects[index + 1], projects[index]] = [projects[index], projects[index + 1]];
        renderList();
        return;
      } else if (action === "save-remote") {
        saveOneToGitHub(projects[index], item.querySelector("[data-item-status]"), item);
        return;
      } else if (action === "delete-remote") {
        deleteOneFromGitHub(projects[index], index, item.querySelector("[data-item-status]"));
        return;
      }
    });
  }

  function requireGitHubModules(statusEl) {
    if (!window.GitHubSync || !window.ProjectStore) {
      const missing = !window.GitHubSync ? "assets/js/github-sync.js" : "assets/js/project-store.js";
      const msg = `GitHub sync isn't available: ${missing} didn't load. Check it's present in your assets/js/ folder and that <script src="${missing}"> is in this page, before assets/js/projects-admin.js.`;
      if (statusEl) { statusEl.dataset.state = "error"; statusEl.textContent = msg; }
      return false;
    }
    return true;
  }

  /**
   * Saves exactly one project as its own file (create, update, or
   * move if its category/subcategory/id changed), then regenerates
   * projects.json so the live site picks up the change too.
   */
  async function saveOneToGitHub(project, statusEl, item) {
    if (!requireGitHubModules(statusEl)) return;
    if (!project.id.trim()) {
      statusEl.dataset.state = "error";
      statusEl.textContent = "This project needs an ID/slug before it can be saved.";
      return;
    }
    statusEl.dataset.state = "";
    statusEl.textContent = "Saving to GitHub…";
    try {
      const assetInput = item?.querySelector('input[data-field="asset-upload"]');
      const assetFiles = Array.from(assetInput?.files || []);
      if (assetFiles.length) {
        statusEl.textContent = `Saving to GitHub and uploading ${assetFiles.length} asset${assetFiles.length === 1 ? "" : "s"}…`;
        for (const file of assetFiles) {
          const assetPath = window.ProjectStore.assetPathFor(project, file.name);
          await window.GitHubSync.commitBinaryFile(assetPath, file, `Upload project asset: ${project.id}/${file.name}`);
          if (!project.thumbnail) {
            project.thumbnail = assetPath;
          }
          if (!Array.isArray(project.gallery)) {
            project.gallery = [];
          }
          if (!project.gallery.includes(assetPath)) {
            project.gallery.push(assetPath);
          }
        }
      }

      const newPath = await window.ProjectStore.saveProject(project, project._path);
      project._path = newPath;
      statusEl.dataset.state = "success";
      statusEl.textContent = `Saved to ${newPath}.`;

      statusEl.textContent += " Rebuilding projects.json…";
      const count = await window.ProjectStore.rebuildIndex(projects);
      statusEl.textContent = `Saved to ${newPath}. projects.json rebuilt (${count} projects). Your site will redeploy shortly.`;
      renderList();
    } catch (err) {
      statusEl.dataset.state = "error";
      statusEl.textContent = `Save failed — your edits are still here, nothing was lost. ${err.message}`;
    }
  }

  /**
   * Deletes a project's file from GitHub and removes it from the
   * working list, then rebuilds projects.json so the live site
   * stops listing it too.
   */
  async function deleteOneFromGitHub(project, index, statusEl) {
    if (!requireGitHubModules(statusEl)) return;
    if (!project._path) {
      statusEl.dataset.state = "error";
      statusEl.textContent = "This project hasn't been saved to GitHub yet, so there's no file to delete there.";
      return;
    }
    if (!confirm(`Delete ${project._path} from GitHub? This can't be undone from here (though it stays in your git history).`)) return;

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
      if (!requireGitHubModules(status)) return;

      const missingIds = projects.filter((p) => !p.id.trim());
      if (missingIds.length) {
        status.dataset.state = "error";
        status.textContent = `${missingIds.length} project${missingIds.length === 1 ? "" : "s"} still need an ID/slug before saving.`;
        return;
      }

      localStorage.setItem(DRAFT_KEY, JSON.stringify(exportProjects()));

      let saved = 0, failed = [];
      for (const project of projects) {
        status.dataset.state = "";
        status.textContent = `Pushing ${saved + failed.length + 1} of ${projects.length}: ${project.id}…`;
        try {
          const item = document.querySelector(`.achievement-admin-item[data-key="${project._key}"]`);
          const assetInput = item?.querySelector('input[data-field="asset-upload"]');
          const assetFiles = Array.from(assetInput?.files || []);
          if (assetFiles.length) {
            for (const file of assetFiles) {
              const assetPath = window.ProjectStore.assetPathFor(project, file.name);
              await window.GitHubSync.commitBinaryFile(assetPath, file, `Upload project asset: ${project.id}/${file.name}`);
              if (!project.thumbnail) {
                project.thumbnail = assetPath;
              }
              if (!Array.isArray(project.gallery)) {
                project.gallery = [];
              }
              if (!project.gallery.includes(assetPath)) {
                project.gallery.push(assetPath);
              }
            }
          }
          project._path = await window.ProjectStore.saveProject(project, project._path);
          saved++;
        } catch (err) {
          failed.push(`${project.id}: ${err.message}`);
        }
      }

      status.textContent = "Rebuilding projects.json…";
      try {
        const count = await window.ProjectStore.rebuildIndex(projects);
        status.dataset.state = failed.length ? "error" : "success";
        status.textContent = `Pushed ${saved} project file${saved === 1 ? "" : "s"} individually and rebuilt projects.json (${count} projects).` +
          (failed.length ? ` ${failed.length} failed: ${failed.join("; ")}` : " Your site will redeploy shortly.");
        renderList();
      } catch (err) {
        status.dataset.state = "error";
        status.textContent = `Saved ${saved} project file${saved === 1 ? "" : "s"}, but rebuilding projects.json failed: ${err.message}. Your per-project files are safe — retry the push to rebuild the index.`;
      }
    });

    document.getElementById("projectLoadGitHubButton")?.addEventListener("click", async () => {
      const status = document.getElementById("projectsLoadStatus");
      if (!requireGitHubModules(status)) return;

      status.textContent = "Reading data/projects/ from GitHub…";
      try {
        const { projects: loaded, errors } = await window.ProjectStore.loadAllFromGitHub();
        if (!loaded.length && !errors.length) {
          status.textContent = "No project files found yet at data/projects/ — nothing to load. Use \"Save this project to GitHub\" on a project to create the first one.";
          return;
        }
        projects = loaded.map(({ project, path }) => Object.assign(blankProject(), project, { _key: uid(), _path: path }));
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

    if (!window.GitHubSync) console.error("[projects-admin] window.GitHubSync is undefined — assets/js/github-sync.js did not load. Check the <script> tag and that the file exists.");
    if (!window.ProjectStore) console.error("[projects-admin] window.ProjectStore is undefined — assets/js/project-store.js did not load. Check the <script> tag and that the file exists.");
    if (window.GitHubSync) window.GitHubSync.initSyncSettings(document.getElementById("ghSyncSettings"));

    initLoadPanel();
    initImport();
    initListEvents();
    initSave();
    loadFromFetch();
  });
})();
