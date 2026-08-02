/* ==========================================================
   PROJECT DATA LAYER
   Fetches projects.json once, flattens every discipline
   into a single array, and renders it into whichever grid(s)
   exist on the current page. Nothing here is hardcoded —
   add a project to projects.json and it appears everywhere
   relevant automatically (including a future admin.html
   generator).
========================================================== */

const PROJECTS_URL = "projects.json";

let projectsCache = null;

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

/**
 * Fetches projects.json and flattens every category array
 * (dfma, fea, cfd, eacg, control-systems, robotics, embedded, manufacturing, ...)
 * into one list of project objects. Each project keeps its
 * own "category" field from the JSON.
 */
async function getProjects() {
    if (projectsCache) return projectsCache;

    const res = await fetch(PROJECTS_URL);

    if (!res.ok) {
        throw new Error(`Couldn't load projects.json (${res.status})`);
    }

    const data = await res.json();

    // projects.json is a flat array of project objects. (Also accepts the
    // older category-grouped-object shape, for safety.)
    projectsCache = Array.isArray(data)
        ? data
        : Object.values(data).filter(Array.isArray).flat();

    return projectsCache;
}

/**
 * Builds a single project card. Works for both the compact
 * grid view and the featured view.
 */
function renderProjectCard(project) {
    const meta = [
        project.status,
        project.difficulty,
        project.duration
    ].filter(Boolean);

    return `
        <a class="card project-card" href="projects.html?id=${encodeURIComponent(project.slug)}">
            <div class="pc-media">
                ${project.status ? `<span class="pc-status">${escapeHtml(project.status)}</span>` : ""}
                <img
                    src="${project.coverImage}"
                    alt="${escapeHtml(project.title)}"
                    loading="lazy"
                    onerror="this.parentElement.style.display='none'">
            </div>
            <div class="pc-body">
                <span class="pc-eyebrow">${escapeHtml((project.category || "").toUpperCase())}</span>
                <h3>${escapeHtml(project.title)}</h3>
                <p>${escapeHtml(project.subtitle || project.description || "")}</p>
                <div class="pc-meta">
                    ${meta.map(m => `<span>${escapeHtml(m)}</span>`).join("")}
                </div>
            </div>
        </a>
    `;
}

function renderEmptyState(message, hint) {
    return `
        <div class="empty-state">
            <strong>${escapeHtml(message)}</strong>
            <p>${escapeHtml(hint || "")}</p>
        </div>
    `;
}

function renderSkeletons(count = 3) {
    return Array.from({ length: count }, () => `<div class="skeleton-card"></div>`).join("");
}

/**
 * Renders a filtered list of projects into a container by id.
 * Re-triggers the card reveal-on-scroll animation afterwards.
 */
function renderGrid(containerId, projects, emptyMessage) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!projects.length) {
        el.innerHTML = renderEmptyState(
            emptyMessage || "No projects here yet",
            "New work is on the way — check back soon."
        );
        return;
    }

    el.innerHTML = projects.map(renderProjectCard).join("");

    if (window.initCardReveal) window.initCardReveal(el);
}

/* ==========================================================
   FEATURED PROJECTS (index.html)
========================================================== */
async function loadFeaturedProjects() {
    const el = document.getElementById("featuredProjects");
    if (!el) return;

    el.innerHTML = renderSkeletons(3);

    try {
        const projects = await getProjects();
        const featured = projects.filter(p => p.featured);
        renderGrid(
            "featuredProjects",
            featured.length ? featured : projects.slice(0, 3),
            "Featured projects are coming soon"
        );
    } catch (err) {
        el.innerHTML = renderEmptyState("Couldn't load projects", err.message);
    }
}

/* ==========================================================
   CATEGORY GRIDS (specialization page, robotics.html)
========================================================== */
async function loadCategoryGrid(containerId, categories) {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = renderSkeletons(3);

    try {
        const projects = await getProjects();
        const filtered = projects.filter(p => categories.includes(p.category));
        renderGrid(containerId, filtered, "No projects in this discipline yet");
    } catch (err) {
        el.innerHTML = renderEmptyState("Couldn't load projects", err.message);
    }
}

/* ==========================================================
   PORTFOLIO — search + filter (portfolio.html)
========================================================== */
async function loadPortfolio() {
    const grid = document.getElementById("portfolioProjects");
    if (!grid) return;

    const searchBox = document.getElementById("searchBox");
    const chipsWrap = document.getElementById("filterChips");
    const countEl = document.getElementById("resultsCount");

    grid.innerHTML = renderSkeletons(6);

    let allProjects = [];
    let activeCategory = "all";

    try {
        allProjects = await getProjects();
    } catch (err) {
        grid.innerHTML = renderEmptyState("Couldn't load projects", err.message);
        return;
    }

    const categories = ["all", ...new Set(allProjects.map(p => p.category).filter(Boolean))];

    if (chipsWrap) {
        chipsWrap.innerHTML = categories.map(cat => `
            <button
                type="button"
                class="filter-chip"
                data-category="${escapeHtml(cat)}"
                aria-pressed="${cat === "all"}">
                ${escapeHtml(cat === "all" ? "All" : cat.toUpperCase())}
            </button>
        `).join("");
    }

    function apply() {
        const query = (searchBox?.value || "").trim().toLowerCase();

        const filtered = allProjects.filter(p => {
            const matchesCategory = activeCategory === "all" || p.category === activeCategory;
            if (!matchesCategory) return false;

            if (!query) return true;

            const haystack = [
                p.title,
                p.subtitle,
                p.category,
                ...(p.software || []),
                ...(p.tags || [])
            ].join(" ").toLowerCase();

            return haystack.includes(query);
        });

        renderGrid("portfolioProjects", filtered, "No projects match your search");

        if (countEl) {
            countEl.textContent = `${filtered.length} project${filtered.length === 1 ? "" : "s"}`;
        }
    }

    if (searchBox) {
        searchBox.addEventListener("input", apply);
    }

    if (chipsWrap) {
        chipsWrap.addEventListener("click", (e) => {
            const btn = e.target.closest(".filter-chip");
            if (!btn) return;

            activeCategory = btn.dataset.category;

            chipsWrap.querySelectorAll(".filter-chip").forEach(c =>
                c.setAttribute("aria-pressed", String(c === btn))
            );

            apply();
        });
    }

    apply();
}

/* ==========================================================
   PROJECT DETAIL PAGE (projects.html?id=slug)
========================================================== */
async function loadProject() {
    const title = document.getElementById("projectTitle");
    if (!title) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("id");

    let projects;

    try {
        projects = await getProjects();
    } catch (err) {
        title.innerText = "Couldn't load this project";
        const desc = document.getElementById("projectDescription");
        if (desc) desc.innerText = err.message;
        return;
    }

    const project = projects.find(p => p.slug === slug);

    if (!project) {
        title.innerText = "Project not found";
        const desc = document.getElementById("projectDescription");
        if (desc) desc.innerText = "That project doesn't exist or may have been moved. Head back to the portfolio to browse everything.";
        return;
    }

    document.title = `${project.title} | Lewis Mutwiri`;
    title.innerText = project.title;

    const description = document.getElementById("projectDescription");
    if (description) description.innerText = project.description || "";

    /* meta bar: status / difficulty / duration */
    const metaBar = document.getElementById("projectMetaBar");
    if (metaBar) {
        const bits = [project.status, project.difficulty, project.duration].filter(Boolean);
        metaBar.innerHTML = bits.map(b => `<span>${escapeHtml(b)}</span>`).join("");
    }

    const image = document.getElementById("projectImage");
    if (image) {
        image.src = project.coverImage;
        image.alt = project.title;
        image.decoding = "async";
        image.fetchPriority = "high";
        image.onerror = () => { image.style.display = "none"; };
    }

    const tags = document.getElementById("projectTags");
    if (tags) {
        tags.innerHTML = (project.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    }

    const software = document.getElementById("softwareList");
    if (software) {
        software.innerHTML = (project.software || []).map(item => `<span>${escapeHtml(item)}</span>`).join("");
    }

    const process = document.getElementById("engineeringProcess");
    if (process) {
        process.innerHTML = (project.engineeringProcess || []).map(step => `<span>${escapeHtml(step)}</span>`).join("");
    }

    const problem = document.getElementById("problem");
    if (problem) problem.innerText = project.problem || "";

    const solution = document.getElementById("solution");
    if (solution) solution.innerText = project.solution || "";

    const gallery = document.getElementById("projectGallery");
    if (gallery) {
        gallery.innerHTML = (project.gallery || []).map((img, index) => `
            <img
                class="gallery-image"
                src="${img}"
                alt="${escapeHtml(project.title)} — image ${index + 1}"
                loading="lazy"
                onerror="this.remove()">
        `).join("");
    }

    const downloads = document.getElementById("downloadButtons");
    if (downloads) {
        const entries = Object.entries(project.downloads || {}).filter(([, file]) => file && file.trim() !== "");
        downloads.innerHTML = entries.length
            ? entries.map(([name, file]) => `
                <a class="btn-primary" href="${file}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(name.toUpperCase())}
                </a>
            `).join("")
            : `<p>No downloadable files for this project yet.</p>`;
    }

    const links = document.getElementById("projectLinks");
    if (links) {
        let html = "";

        if (project.youtube && project.youtube.trim() !== "") {
            html += `
                <a href="${project.youtube}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                    ▶ Watch on YouTube
                </a>
            `;
        }

        if (project.github && project.github.trim() !== "") {
            html += `
                <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="btn-secondary">
                    💻 GitHub repository
                </a>
            `;
        }

        links.innerHTML = html || `<p>No external links for this project yet.</p>`;
    }
}

/* ==========================================================
   BOOTSTRAP — run whichever loaders match the current page
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
    loadFeaturedProjects();
    loadCategoryGrid("cadProjects", ["cad"]);
    loadCategoryGrid("roboticsProjects", ["robotics", "embedded"]);
    loadCategoryGrid("dfmaProjects", ["dfma"]);
    loadCategoryGrid("feaProjects", ["fea"]);
    loadCategoryGrid("cfdProjects", ["cfd"]);
    loadCategoryGrid("eacgProjects", ["eacg"]);
    loadCategoryGrid("controlProjects", ["control-systems", "control"]);
    loadPortfolio();
    loadProject();
});
