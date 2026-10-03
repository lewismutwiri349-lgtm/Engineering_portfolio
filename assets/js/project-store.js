/* ==========================================================
   PROJECT STORE
   Owns the "one JSON file per project" data model: where a
   project's file lives on disk, and how saving/deleting/
   renaming a project translates into GitHub commits.

   This module knows nothing about the DOM or forms — it only
   talks to window.GitHubSync (the low-level GitHub API client)
   and works with plain project objects. projects-admin.js is
   the only thing that should call into this file.

   Why there's still a projects.json: the live site's own
   script.js/projects.js fetch a single projects.json in one
   request for speed (a static page can't cheaply "list a
   GitHub folder" on every visit without hammering the GitHub
   API). So per-project files are the source of truth you edit
   and commit individually — but every save also regenerates
   projects.json as a derived index, committed alongside it, so
   the live site keeps working exactly as before.
========================================================== */

(function () {
  "use strict";

  const BASE_DIR = "assets/projects";
  const INDEX_PATH = "projects.json";

  function slugify(text) {
    return (text || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * The path a project's file should live at, derived from its
   * category, subcategory and id. Two projects with the same id
   * in different categories would collide with the old single-
   * file model but can't here — each gets its own folder.
   */
  function pathFor(project) {
    const category = slugify(project.category || "uncategorized");
    const subcategory = slugify(project.subcategory || "general");
    const slug = slugify(project.id || project.title);
    return `${BASE_DIR}/${category}/${subcategory}/${slug}.json`;
  }

  /**
   * Where an uploaded image lives — same BASE_DIR as the per-project
   * JSON files (assets/projects/...), just without the "images"
   * segment, since that's not actually part of the repo's real
   * folder layout. One folder per category (cad, robotics, cfd,
   * ...), one subfolder per project.
   */
  function assetRootFor(project) {
    const category = slugify(project.category || "uncategorized");
    const slug = slugify(project.id || project.title || "project");
    return `${BASE_DIR}/${category}/${slug}`;
  }

  function safeFileName(fileName) {
    return String(fileName || "asset")
      .trim()
      .toLowerCase()
      .replace(/[\\/]+/g, "_")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+/, "") || "asset";
  }

  function assetPathFor(project, fileName) {
    return `${assetRootFor(project)}/${safeFileName(fileName)}`;
  }

  /** Videos (and their posters) live in a videos/ subfolder of the project's asset folder. */
  function videoPathFor(project, fileName) {
    return `${assetRootFor(project)}/videos/${safeFileName(fileName)}`;
  }

  /** True if `path` is inside this project's own asset folder (safe to delete with the project). */
  function isOwnAsset(project, path) {
    return typeof path === "string" && path.startsWith(assetRootFor(project) + "/");
  }

  /** Removes editor-only state (anything starting with "_") before saving. */
  function stripInternal(project) {
    const clean = {};
    Object.keys(project).forEach((k) => {
      if (!k.startsWith("_")) clean[k] = project[k];
    });
    return clean;
  }

  /**
   * Saves one project as its own file. If `previousPath` is given
   * and differs from where the project belongs now (its category,
   * subcategory, or id changed), the old file is deleted and the
   * new one created — a rename/move, not a duplicate.
   * Returns the path the project now lives at.
   */
  async function saveProject(project, previousPath) {
    const newPath = pathFor(project);
    const content = JSON.stringify(stripInternal(project), null, 2);

    if (previousPath && previousPath !== newPath) {
      await window.GitHubSync.deleteFile(previousPath, `Move project: ${project.id} (${previousPath} → ${newPath})`);
    }
    await window.GitHubSync.commitFile(newPath, content, `Save project: ${project.id}`);
    return newPath;
  }

  /**
   * Deletes a project's file. Safe to call even if the path is
   * already gone (GitHubSync.deleteFile no-ops on a missing file).
   */
  async function deleteProject(path, projectId) {
    if (!path) return;
    await window.GitHubSync.deleteFile(path, `Delete project: ${projectId || path}`);
  }

  /**
   * Fetches and parses the currently-live projects.json from GitHub
   * (the root index, not a per-project file). Returns [] if it
   * doesn't exist yet or fails to parse — this is a safety net, not
   * a hard requirement.
   */
  async function loadCurrentIndex() {
    try {
      const file = await window.GitHubSync.getFile(INDEX_PATH);
      if (!file) return [];
      const parsed = JSON.parse(file.content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function mergeProjects(existingProjects, remoteProjects) {
    const merged = [];
    const byId = new Map();

    const addProject = (project, source) => {
      const id = String(project?.id || project?.title || "").trim().toLowerCase();
      if (!id) return;
      if (byId.has(id)) {
        const existingIndex = merged.findIndex((entry) => String(entry.id || entry.title || "").trim().toLowerCase() === id);
        if (existingIndex !== -1) {
          merged[existingIndex] = { ...merged[existingIndex], ...project };
        }
        return;
      }
      byId.set(id, merged.length);
      merged.push(project);
    };

    (existingProjects || []).forEach((project) => addProject(project, "local"));
    (remoteProjects || []).forEach((entry) => addProject(entry.project || entry, "remote"));

    return merged;
  }

  /**
   * Regenerates and commits projects.json from the full in-memory
   * project list, merged with whatever is already stored in GitHub,
   * so the live site (which reads that one file) reflects the full
   * set of per-project files rather than only the current local list.
   */
  async function rebuildIndex(allProjects, deletedIds) {
    const excluded = new Set((deletedIds || []).map((id) => String(id).trim().toLowerCase()));
    const remoteResult = await loadAllFromGitHub();
    const currentIndex = await loadCurrentIndex();

    // Priority, lowest to highest: the index currently live on GitHub
    // (catches anything not yet split into its own file, or not
    // currently loaded into the admin's working list) < individually
    // saved per-project files < the admin's current working list
    // (your most recent edits). This means a rebuild can never lose a
    // project just because it wasn't loaded locally at the time.
    let combined = mergeProjects(currentIndex, remoteResult.projects || []);
    combined = mergeProjects(combined, allProjects);

    const clean = combined
      .filter((p) => !excluded.has(String(p?.id || p?.title || "").trim().toLowerCase()))
      .map(stripInternal);

    await window.GitHubSync.commitFile(
      INDEX_PATH,
      JSON.stringify(clean, null, 2),
      `Rebuild projects.json index (${clean.length} project${clean.length === 1 ? "" : "s"})`
    );
    return clean.length;
  }

  /**
   * Recursively reads every project file under asset/projects/ from
   * GitHub and returns them as { project, path } pairs, ready to
   * drop into the admin's in-memory list. Returns [] if the
   * directory doesn't exist yet (first run, nothing saved there).
   */
  async function loadAllFromGitHub() {
    const paths = (await window.GitHubSync.listFilesRecursive(BASE_DIR))
      .filter((p) => p.toLowerCase().endsWith(".json"));

    const out = [];
    const errors = [];
    for (const path of paths) {
      try {
        const file = await window.GitHubSync.getFile(path);
        if (!file) continue;
        const project = JSON.parse(file.content);
        out.push({ project, path });
      } catch (e) {
        errors.push(`${path}: ${e.message}`);
      }
    }
    return { projects: out, errors };
  }

  window.ProjectStore = {
    BASE_DIR,
    INDEX_PATH,
    pathFor,
    assetRootFor,
    assetPathFor,
    videoPathFor,
    safeFileName,
    isOwnAsset,
    stripInternal,
    saveProject,
    deleteProject,
    rebuildIndex,
    loadAllFromGitHub
  };
})();
