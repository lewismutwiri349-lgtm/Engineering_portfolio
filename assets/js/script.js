/* ==========================================
   PROJECT PAGE
========================================== */

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

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

        if (desc) {
            desc.innerText = err.message;
        }

        return;

    }

    const project = projects.find(p => p.slug === slug);

    if (!project) {

        title.innerText = "Project Not Found";

        const desc = document.getElementById("projectDescription");

        if (desc) {
            desc.innerText = "That project doesn't exist or may have been moved.";
        }

        return;

    }

    /* ==========================================
       PAGE INFORMATION
    ========================================== */

    document.title = `${project.title} | Lewis Mutwiri`;

    title.innerText = project.title;

    const description = document.getElementById("projectDescription");

    if (description) {
        description.innerText = project.description || "";
    }

    const image = document.getElementById("projectImage");

    if (image) {

        image.src = project.coverImage;
        image.alt = project.title;

        image.decoding = "async";
        image.fetchPriority = "high";

        image.onerror = () => {

            image.style.display = "none";

        };

    }

    /* ==========================================
       TAGS
    ========================================== */

    const tags = document.getElementById("projectTags");

    if (tags) {

        tags.innerHTML = (project.tags || [])

            .map(tag => `<span>${escapeHtml(tag)}</span>`)

            .join("");

    }

    /* ==========================================
       SOFTWARE
    ========================================== */

    const software = document.getElementById("softwareList");

    if (software) {

        software.innerHTML = (project.software || [])

            .map(item => `<span>${escapeHtml(item)}</span>`)

            .join("");

    }

    /* ==========================================
       ENGINEERING PROCESS
    ========================================== */

    const process = document.getElementById("engineeringProcess");

    if (process) {

        process.innerHTML = (project.engineeringProcess || [])

            .map(step => `<span>${escapeHtml(step)}</span>`)

            .join("");

    }

    /* ==========================================
       ENGINEERING PROBLEM
    ========================================== */

    const problem = document.getElementById("problem");

    if (problem) {

        problem.innerText = project.problem || "";

    }

    /* ==========================================
       ENGINEERING SOLUTION
    ========================================== */

    const solution = document.getElementById("solution");

    if (solution) {

        solution.innerText = project.solution || "";

    }

    /* ==========================================
       PROJECT GALLERY
    ========================================== */

    const gallery = document.getElementById("projectGallery");

    if (gallery) {

        gallery.innerHTML = (project.gallery || [])

            .map((img, index) => `

                <img
                    class="gallery-image"
                    src="${img}"
                    alt="${escapeHtml(project.title)} - Image ${index + 1}"
                    loading="lazy"
                    onerror="this.remove()">

            `)

            .join("");

    }

    /* ==========================================
       DOWNLOAD BUTTONS
    ========================================== */

    const downloads = document.getElementById("downloadButtons");

    if (downloads) {

        downloads.innerHTML = Object.entries(project.downloads || {})

            .filter(([, file]) => file && file.trim() !== "")

            .map(([name, file]) => `

                <a
                    class="btn-primary"
                    href="${file}"
                    target="_blank"
                    rel="noopener noreferrer">

                    ${escapeHtml(name.toUpperCase())}

                </a>

            `)

            .join("");

    }

    /* ==========================================
       PROJECT LINKS
    ========================================== */

    const links = document.getElementById("projectLinks");

    if (links) {

        let html = "";

        if (project.youtube && project.youtube.trim() !== "") {

            html += `

                <a
                    href="${project.youtube}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-primary">

                    ▶ Watch on YouTube

                </a>

            `;

        }

        if (project.github && project.github.trim() !== "") {

            html += `

                <a
                    href="${project.github}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-secondary">

                    💻 GitHub Repository

                </a>

            `;

        }

        links.innerHTML = html;

    }

}

/* ==========================================
   START
========================================== */

document.addEventListener("DOMContentLoaded", loadProject);