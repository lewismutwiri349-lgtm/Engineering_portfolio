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

  function assetRootFor(project) {
    const category = slugify(project.category || "general");
    const slug = slugify(project.id || project.title || "project");
    const software = (project.software || []).map((item) => String(item || "").toLowerCase());
    let family = "general";

    if (software.some((item) => item.includes("ansys") || item.includes("fluent"))) {
      family = "Ansys";
    } else if (software.some((item) => item.includes("solidworks"))) {
      family = "SolidWorks";
    } else if (["cfd", "fea", "eacg"].includes(category)) {
      family = "Ansys";
    } else if (["cad", "dfma"].includes(category)) {
      family = "SolidWorks";
    }

    return `assets/images/projects/general/${family}/${slug}`;
  }

  function assetPathFor(project, fileName) {
    const safeName = String(fileName || "asset").replace(/[\\/]+/g, "_");
    return `${assetRootFor(project)}/${safeName}`;
  }

  function stripInternal(project) {
    const clean = Object.assign({}, project);
    delete clean._key;
    delete clean._path;
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
   * Regenerates and commits projects.json from the full in-memory
   * project list, so the live site (which reads that one file)
   * reflects whatever's currently in the per-project files.
   */
  async function rebuildIndex(allProjects) {
    const clean = allProjects.map(stripInternal);
    await window.GitHubSync.commitFile(
      INDEX_PATH,
      JSON.stringify(clean, null, 2),
      `Rebuild projects.json index (${clean.length} project${clean.length === 1 ? "" : "s"})`
    );
    return clean.length;
  }

  /**
   * Recursively reads every project file under data/projects/ from
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
    saveProject,
    deleteProject,
    rebuildIndex,
    loadAllFromGitHub
  };
})();
