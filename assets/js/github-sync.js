/* ==========================================================
   GITHUB SYNC
   Commits a file straight to your GitHub repo using the
   Contents API, called from the browser with a personal
   access token you paste in once. The token is stored only
   in this browser's localStorage and sent only to
   api.github.com — never to any server of mine, there isn't
   one. Clear it any time from the settings panel.

   Token needs "repo" scope (classic PAT) or, for a fine-
   grained PAT, read/write access to "Contents" on this repo.
========================================================== */

(function () {
  "use strict";

  const CONFIG_KEY = "gh-sync-config";

  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  function clearConfig() {
    localStorage.removeItem(CONFIG_KEY);
  }

  function b64EncodeUtf8(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  /**
   * Fetches a single file's decoded text content and sha, or null if it
   * doesn't exist. Throws on any other error (bad auth, rate limit, etc).
   */
  async function getFile(path) {
    const { apiUrl, headers, branch } = requestContext(path);
    const res = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Couldn't read ${path} (${res.status}): ${err.message || res.statusText}`);
    }
    const data = await res.json();
    return { sha: data.sha, content: b64DecodeUtf8(data.content) };
  }

  /**
   * Commits `content` (a string) to `path` in the configured repo.
   * Creates the file if it doesn't exist, updates it (using its
   * current sha) if it does. Returns the GitHub API response.
   */
  async function commitFile(path, content, message) {
    const { apiUrl, headers, branch } = requestContext(path);

    // look up the current file's sha (needed to update an existing file;
    // a 404 here just means we're creating it for the first time)
    let sha;
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.json().catch(() => ({}));
      throw new Error(`Couldn't check the existing file (${getRes.status}): ${err.message || getRes.statusText}`);
    }

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: message || `Update ${path}`,
        content: b64EncodeUtf8(content),
        branch,
        ...(sha ? { sha } : {})
      })
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(`GitHub rejected the commit (${putRes.status}): ${err.message || putRes.statusText}`);
    }

    return putRes.json();
  }

  /**
   * Commits a binary File/Blob (image, video, ...) to `path`.
   * `onProgress(fraction)` is optional (0..1); when given, the upload
   * goes through XMLHttpRequest because fetch() can't report upload
   * progress. Without it the original fetch() path is used.
   */
  async function commitBinaryFile(path, file, message, onProgress) {
    const { apiUrl, headers, branch } = requestContext(path);

    let sha;
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.json().catch(() => ({}));
      throw new Error(`Couldn't check the existing file (${getRes.status}): ${err.message || getRes.statusText}`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const content = b64EncodeBytes(arrayBuffer);
    const body = JSON.stringify({
      message: message || `Upload ${path}`,
      content,
      branch,
      ...(sha ? { sha } : {})
    });

    if (typeof onProgress === "function") {
      return putWithProgress(apiUrl, headers, body, onProgress);
    }

    const putRes = await fetch(apiUrl, { method: "PUT", headers, body });
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(`GitHub rejected the upload (${putRes.status}): ${err.message || putRes.statusText}`);
    }
    return putRes.json();
  }

  function putWithProgress(url, headers, body, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onerror = () => reject(new Error("Network error while uploading to GitHub."));
      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch (e) { /* non-JSON error body */ }
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(1);
          resolve(data);
        } else {
          reject(new Error(`GitHub rejected the upload (${xhr.status}): ${data.message || xhr.statusText}`));
        }
      };
      xhr.send(body);
    });
  }

  /**
   * Deletes `path` from the repo. No-ops (returns null) if the file
   * doesn't exist rather than throwing, since "already gone" is a fine
   * outcome for a delete.
   */
  async function deleteFile(path, message) {
    const { apiUrl, headers, branch } = requestContext(path);

    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
    if (getRes.status === 404) return null;
    if (!getRes.ok) {
      const err = await getRes.json().catch(() => ({}));
      throw new Error(`Couldn't find ${path} to delete (${getRes.status}): ${err.message || getRes.statusText}`);
    }
    const existing = await getRes.json();

    const delRes = await fetch(apiUrl, {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        message: message || `Delete ${path}`,
        sha: existing.sha,
        branch
      })
    });
    if (!delRes.ok) {
      const err = await delRes.json().catch(() => ({}));
      throw new Error(`GitHub rejected the delete (${delRes.status}): ${err.message || delRes.statusText}`);
    }
    return delRes.json();
  }

  /**
   * Recursively lists every file path under `dirPath` (skips
   * subdirectories transparently, returns only files). Returns []
   * if the directory doesn't exist yet (nothing committed there yet).
   */
  async function listFilesRecursive(dirPath) {
    const cfg = requireConfig();
    const branch = cfg.branch || "main";
    const headers = authHeaders(cfg);
    const results = [];

    async function walk(path) {
      const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
      const res = await fetch(url, { headers });
      if (res.status === 404) return; // directory doesn't exist yet
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Couldn't list ${path} (${res.status}): ${err.message || res.statusText}`);
      }
      const entries = await res.json();
      const list = Array.isArray(entries) ? entries : [entries];
      for (const entry of list) {
        if (entry.type === "dir") {
          await walk(entry.path);
        } else if (entry.type === "file") {
          results.push(entry.path);
        }
      }
    }

    await walk(dirPath);
    return results;
  }

  function requireConfig() {
    const cfg = getConfig();
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      throw new Error("GitHub sync isn't set up yet — open Sync Settings and fill in your token, owner and repo.");
    }
    return cfg;
  }

  function authHeaders(cfg) {
    return {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    };
  }

  function requestContext(path) {
    const cfg = requireConfig();
    return {
      apiUrl: `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`,
      headers: authHeaders(cfg),
      branch: cfg.branch || "main"
    };
  }

  function b64DecodeUtf8(b64) {
    return decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
  }

  function b64EncodeBytes(bytes) {
    const array = new Uint8Array(bytes);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < array.length; i += chunk) {
      binary += String.fromCharCode(...array.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  /**
   * Renders a small settings panel into `containerEl` for entering
   * repo owner/name/branch/token, and wires up its Save/Clear buttons.
   * Call once per admin page.
   */
  function initSyncSettings(containerEl) {
    if (!containerEl) return;
    const cfg = getConfig();

    containerEl.innerHTML = `
      <details class="gh-sync-panel">
        <summary>GitHub Sync Settings ${cfg.token ? "— connected to " + escapeAttr(cfg.owner) + "/" + escapeAttr(cfg.repo) : "— not connected"}</summary>
        <div class="gh-sync-form">
          <label>Repo owner (your GitHub username)
            <input class="achievement-input" id="ghOwner" value="${escapeAttr(cfg.owner || "")}" placeholder="lewismutwiri">
          </label>
          <label>Repo name
            <input class="achievement-input" id="ghRepo" value="${escapeAttr(cfg.repo || "")}" placeholder="portfolio-site">
          </label>
          <label>Branch
            <input class="achievement-input" id="ghBranch" value="${escapeAttr(cfg.branch || "main")}" placeholder="main">
          </label>
          <label>Personal access token
            <input class="achievement-input" id="ghToken" type="password" value="${escapeAttr(cfg.token || "")}" placeholder="ghp_...">
          </label>
          <div class="gh-sync-form__actions">
            <button type="button" class="btn-secondary" id="ghSaveConfig">Save settings</button>
            <button type="button" class="btn-secondary" id="ghClearConfig">Forget token</button>
          </div>
          <p class="gh-sync-hint">
            Needs a token with <code>repo</code> scope (classic) or Contents read/write (fine-grained), scoped to this repo only. Stored only in this browser.
            <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">Create one on GitHub →</a>
          </p>
        </div>
      </details>
    `;

    containerEl.querySelector("#ghSaveConfig").addEventListener("click", () => {
      saveConfig({
        owner: containerEl.querySelector("#ghOwner").value.trim(),
        repo: containerEl.querySelector("#ghRepo").value.trim(),
        branch: containerEl.querySelector("#ghBranch").value.trim() || "main",
        token: containerEl.querySelector("#ghToken").value.trim()
      });
      initSyncSettings(containerEl);
    });

    containerEl.querySelector("#ghClearConfig").addEventListener("click", () => {
      clearConfig();
      initSyncSettings(containerEl);
    });
  }

  function escapeAttr(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  }

  window.GitHubSync = {
    getConfig, saveConfig, clearConfig,
    commitFile, commitBinaryFile, getFile, deleteFile, listFilesRecursive,
    initSyncSettings
  };

  // Loud, specific confirmation this module executed — if you ever see
  // "Cannot read properties of undefined (reading 'commitFile')" again,
  // check the browser console for this line. If it's missing, the
  // problem is that this file (assets/js/github-sync.js) isn't loading
  // on the page at all — wrong path, missing <script> tag, or the file
  // wasn't actually copied into assets/js/ on the live site.
  console.log("[github-sync] loaded — window.GitHubSync is ready.");
})();
