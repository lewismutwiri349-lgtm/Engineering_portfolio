(function () {
  "use strict";

  const ACHIEVEMENTS_URL = "data/achievements.json";
  const CATEGORY_OPTIONS = [
    "Certificate",
    "Award",
    "Competition",
    "Scholarship",
    "Leadership",
    "Publication",
    "Workshop",
    "Conference",
    "Volunteer",
    "Other"
  ];

  let achievementsCache = null;

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  }

  function normalizeAchievements(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.achievements)) return data.achievements;
    return [];
  }

  async function getAchievements() {
    if (achievementsCache) return achievementsCache;

    const res = await fetch(ACHIEVEMENTS_URL);
    if (!res.ok) {
      throw new Error(`Couldn't load achievements data (${res.status})`);
    }

    const data = await res.json();
    achievementsCache = normalizeAchievements(data).filter(Boolean);
    return achievementsCache;
  }

  function parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function getThumbnailSource(item) {
    return item.thumbnail || item.image || item.certificateImage || "assets/images/hero-bird.svg";
  }

  function getDocumentSource(item) {
    return item.documentUrl || item.downloadUrl || item.certificateUrl || "";
  }

  function renderSkillTags(skills) {
    return (skills || []).filter(Boolean).map((skill) => `<span>${escapeHtml(skill)}</span>`).join("");
  }

  function renderAchievementCard(item) {
    const docUrl = getDocumentSource(item);
    const thumb = getThumbnailSource(item);
    const featuredMarkup = item.featured ? '<span class="achievement-badge achievement-badge--featured">Featured</span>' : '<span class="achievement-badge">Achievement</span>';

    return `
      <article class="card achievement-card${item.featured ? " achievement-card--featured" : ""}">
        <button type="button" class="achievement-card__thumb" data-full="${escapeHtml(thumb)}" data-title="${escapeHtml(item.title || "Certificate preview")}">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title || "Achievement certificate")}" loading="lazy" onerror="this.src='assets/images/hero-bird.svg'; this.onerror=null;">
        </button>
        <div class="achievement-card__content">
          <div class="achievement-card__topline">
            ${featuredMarkup}
            <span class="achievement-badge achievement-badge--category">${escapeHtml(item.category || "Other")}</span>
          </div>
          <h3>${escapeHtml(item.title || "Untitled achievement")}</h3>
          <p class="achievement-card__issuer">${escapeHtml(item.organization || "Issuer unavailable")}</p>
          <p class="achievement-card__meta">${escapeHtml(item.date || "Date not listed")}</p>
          <p class="achievement-card__description">${escapeHtml(item.description || "")}</p>
          <div class="achievement-tags">${renderSkillTags(item.skills)}</div>
          ${docUrl ? `<div class="achievement-actions">
            <a class="btn-secondary" href="${escapeHtml(docUrl)}" target="_blank" rel="noopener noreferrer">View Certificate</a>
            <a class="btn-primary" href="${escapeHtml(docUrl)}" download="${escapeHtml((item.title || "certificate").toLowerCase().replace(/\s+/g, "-") + ".pdf")}" rel="noopener noreferrer">Download Certificate</a>
          </div>` : '<p class="empty-inline" style="color:var(--text-soft);font-size:.9rem;">Certificate document not published in this repository.</p>'}
        </div>
      </article>
    `;
  }

  function renderEmptyState(message, hint) {
    return `
      <div class="achievement-empty">
        <strong>${escapeHtml(message)}</strong>
        <p>${escapeHtml(hint || "")}</p>
      </div>
    `;
  }

  function initPreviewModal() {
    if (document.getElementById("achievementPreviewModal")) return;

    const modal = document.createElement("div");
    modal.id = "achievementPreviewModal";
    modal.className = "achievement-modal";
    modal.innerHTML = `
      <div class="achievement-modal__backdrop" data-close="true"></div>
      <div class="achievement-modal__panel" role="dialog" aria-modal="true" aria-label="Certificate preview">
        <button type="button" class="achievement-modal__close" data-close="true" aria-label="Close preview">✕</button>
        <img src="" alt="Certificate preview" class="achievement-modal__image">
        <h3 class="achievement-modal__title"></h3>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (event) => {
      if (event.target.matches("[data-close='true']")) {
        modal.classList.remove("is-open");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        modal.classList.remove("is-open");
      }
    });
  }

  function openPreview(src, title) {
    initPreviewModal();
    const modal = document.getElementById("achievementPreviewModal");
    if (!modal) return;

    const img = modal.querySelector(".achievement-modal__image");
    const heading = modal.querySelector(".achievement-modal__title");
    if (img) {
      img.src = src;
      img.onerror = () => {
        img.src = "assets/images/hero-bird.svg";
      };
    }
    if (heading) heading.textContent = title || "Certificate preview";
    modal.classList.add("is-open");
  }

  async function initAchievementsPage() {
    const grid = document.getElementById("achievementsGrid");
    const featured = document.getElementById("featuredAchievements");
    const search = document.getElementById("achievementSearch");
    const categorySelect = document.getElementById("achievementCategory");
    const sortSelect = document.getElementById("achievementSort");
    const countEl = document.getElementById("achievementCount");

    if (!grid && !featured) return;

    initPreviewModal();
    grid.innerHTML = renderEmptyState("Loading achievements…", "Please wait a moment while the content is fetched.");

    try {
      const items = await getAchievements();
      const categories = ["All", ...new Set(items.map((item) => item.category).filter(Boolean))];

      if (categorySelect) {
        categorySelect.innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category === "All" ? "All categories" : category)}</option>`).join("");
      }

      function applyFilters() {
        const query = (search?.value || "").trim().toLowerCase();
        const selectedCategory = categorySelect?.value || "All";
        const selectedSort = sortSelect?.value || "newest";

        let filtered = items.filter((item) => {
          const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
          if (!matchesCategory) return false;
          if (!query) return true;

          const haystack = [
            item.title,
            item.organization,
            item.description,
            item.category,
            ...(item.skills || [])
          ].join(" ").toLowerCase();

          return haystack.includes(query);
        });

        filtered = filtered.slice().sort((a, b) => {
          const aValue = parseDate(a.date);
          const bValue = parseDate(b.date);
          const orderDiff = (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0);
          if (selectedSort === "oldest") {
            return aValue - bValue || orderDiff;
          }
          return bValue - aValue || orderDiff;
        });

        const featuredItems = filtered.filter((item) => item.featured).slice(0, 3);
        const rest = filtered.filter((item) => !item.featured);
        const visible = featuredItems.concat(rest);

        if (featured) {
          featured.innerHTML = featuredItems.length
            ? featuredItems.map(renderAchievementCard).join("")
            : renderEmptyState("Featured achievements will appear here", "Set an achievement to featured to highlight it at the top.");
        }

        if (grid) {
          grid.innerHTML = visible.length
            ? visible.map(renderAchievementCard).join("")
            : renderEmptyState("No achievements match your search", "Try another keyword or category.");
        }

        if (countEl) {
          countEl.textContent = `${visible.length} achievement${visible.length === 1 ? "" : "s"}`;
        }
      }

      [search, categorySelect, sortSelect].forEach((control) => {
        control?.addEventListener("input", applyFilters);
        control?.addEventListener("change", applyFilters);
      });

      document.addEventListener("click", (event) => {
        const trigger = event.target.closest(".achievement-card__thumb");
        if (!trigger) return;
        openPreview(trigger.dataset.full, trigger.dataset.title);
      });

      applyFilters();
    } catch (error) {
      if (featured) featured.innerHTML = renderEmptyState("Couldn't load achievements", error.message);
      if (grid) grid.innerHTML = renderEmptyState("Couldn't load achievements", error.message);
    }
  }

  function buildAdminState(entries) {
    return entries.map((entry, index) => ({
      id: entry.id || `achievement-${index + 1}`,
      title: entry.title || "",
      category: entry.category || "Certificate",
      organization: entry.organization || "",
      date: entry.date || "",
      description: entry.description || "",
      skills: Array.isArray(entry.skills) ? entry.skills : (entry.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean),
      thumbnail: entry.thumbnail || "",
      documentUrl: entry.documentUrl || "",
      featured: Boolean(entry.featured),
      displayOrder: entry.displayOrder || index + 1
    }));
  }

  function renderAdminForm(entries) {
    const list = document.getElementById("achievementAdminList");
    const status = document.getElementById("achievementAdminStatus");
    if (!list) return;

    list.innerHTML = entries.length
      ? entries.map((entry, index) => `
          <article class="achievement-admin-item${entry.featured ? " achievement-admin-item--featured" : ""}">
            <div class="achievement-admin-item__header">
              <h3>${escapeHtml(entry.title || `Achievement ${index + 1}`)}</h3>
              <div class="achievement-admin-item__actions">
                <button type="button" class="btn-secondary achievement-admin-action" data-action="edit" data-index="${index}">Edit</button>
                <button type="button" class="btn-secondary achievement-admin-action" data-action="delete" data-index="${index}">Delete</button>
              </div>
            </div>
            <div class="achievement-form-grid">
              <label>
                <span>Title</span>
                <input class="achievement-input" data-field="title" data-index="${index}" value="${escapeHtml(entry.title || "")}">
              </label>
              <label>
                <span>Category</span>
                <select class="achievement-select" data-field="category" data-index="${index}">
                  ${CATEGORY_OPTIONS.map((option) => `<option value="${escapeHtml(option)}"${option === entry.category ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Organization / Issuer</span>
                <input class="achievement-input" data-field="organization" data-index="${index}" value="${escapeHtml(entry.organization || "")}">
              </label>
              <label>
                <span>Date</span>
                <input class="achievement-input" data-field="date" data-index="${index}" value="${escapeHtml(entry.date || "")}" placeholder="YYYY-MM-DD">
              </label>
              <label class="achievement-form-grid__full">
                <span>Short description</span>
                <textarea class="achievement-textarea" data-field="description" data-index="${index}">${escapeHtml(entry.description || "")}</textarea>
              </label>
              <label>
                <span>Skills</span>
                <input class="achievement-input" data-field="skills" data-index="${index}" value="${escapeHtml((entry.skills || []).join(", "))}">
              </label>
              <label>
                <span>Thumbnail URL</span>
                <input class="achievement-input" data-field="thumbnail" data-index="${index}" value="${escapeHtml(entry.thumbnail || "")}">
              </label>
              <label>
                <span>Certificate / Document URL</span>
                <input class="achievement-input" data-field="documentUrl" data-index="${index}" value="${escapeHtml(entry.documentUrl || "")}">
              </label>
              <label>
                <span>Display order</span>
                <input class="achievement-input" type="number" data-field="displayOrder" data-index="${index}" value="${escapeHtml(String(entry.displayOrder || index + 1))}">
              </label>
              <label class="achievement-checkbox">
                <input type="checkbox" data-field="featured" data-index="${index}"${entry.featured ? " checked" : ""}>
                <span>Featured</span>
              </label>
            </div>
          </article>
        `).join("")
      : `<div class="achievement-empty"><strong>No achievements yet.</strong><p>Add your first certificate or award to get started.</p></div>`;

    if (status) {
      status.textContent = entries.length ? `${entries.length} achievement${entries.length === 1 ? "" : "s"} ready to save.` : "No achievements saved yet.";
    }
  }

  async function initAdminPage() {
    const addBtn = document.getElementById("achievementAddButton");
    const saveBtn = document.getElementById("achievementSaveButton");
    const list = document.getElementById("achievementAdminList");
    const status = document.getElementById("achievementAdminStatus");

    if (!list) return;

    let entries = [];

    try {
      const data = await getAchievements();
      entries = buildAdminState(data);
    } catch (error) {
      if (status) status.textContent = error.message;
      entries = [];
    }

    renderAdminForm(entries);

    const persistDraft = () => {
      localStorage.setItem("portfolio-achievements-draft", JSON.stringify(entries));
    };

    addBtn?.addEventListener("click", () => {
      entries.push({
        id: `achievement-${Date.now()}`,
        title: "",
        category: "Certificate",
        organization: "",
        date: "",
        description: "",
        skills: [],
        thumbnail: "",
        documentUrl: "",
        featured: false,
        displayOrder: entries.length + 1
      });
      renderAdminForm(entries);
      persistDraft();
    });

    list.addEventListener("input", (event) => {
      const field = event.target.dataset.field;
      const index = Number(event.target.dataset.index);
      if (field == null || Number.isNaN(index)) return;

      if (field === "featured") {
        entries[index].featured = event.target.checked;
      } else if (field === "skills") {
        entries[index].skills = event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean);
      } else if (field === "displayOrder") {
        entries[index].displayOrder = Number(event.target.value) || 1;
      } else {
        entries[index][field] = event.target.value;
      }
      persistDraft();
      if (field === "featured" || field === "category") {
        renderAdminForm(entries);
      }
    });

    list.addEventListener("change", (event) => {
      const field = event.target.dataset.field;
      const index = Number(event.target.dataset.index);
      if (field == null || Number.isNaN(index)) return;

      if (field === "featured") {
        entries[index].featured = event.target.checked;
      } else if (field === "category") {
        entries[index].category = event.target.value;
      }
      persistDraft();
      renderAdminForm(entries);
    });

    list.addEventListener("click", (event) => {
      const button = event.target.closest(".achievement-admin-action");
      if (!button) return;

      const index = Number(button.dataset.index);
      if (Number.isNaN(index)) return;

      if (button.dataset.action === "delete") {
        entries.splice(index, 1);
        renderAdminForm(entries);
        persistDraft();
        return;
      }

      if (button.dataset.action === "edit") {
        if (status) {
          status.textContent = `Editing achievement ${index + 1}.`;
        }
      }
    });

    saveBtn?.addEventListener("click", () => {
      const payload = { achievements: entries };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "achievements.json";
      downloadLink.click();
      URL.revokeObjectURL(url);
      localStorage.setItem("portfolio-achievements-draft", JSON.stringify(payload));
      if (status) {
        status.textContent = "Saved a fresh achievements.json download.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("achievementsGrid") || document.getElementById("featuredAchievements")) {
      initAchievementsPage();
    }

    if (document.getElementById("achievementAdminList")) {
      initAdminPage();
    }
  });
})();
