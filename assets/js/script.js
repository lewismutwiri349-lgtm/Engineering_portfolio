/* ==========================================
   PROJECT PAGE
========================================== */

async function loadProject() {

    const title = document.getElementById("projectTitle");

    if (!title) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("id");

    const projects = await getProjects();

    const project = projects.find(p => p.slug === slug);

    if (!project) {

        title.innerText = "Project Not Found";

        return;

    }

    document.title = project.title;

    document.getElementById("projectTitle").innerText = project.title;

    document.getElementById("projectDescription").innerText = project.description;

    document.getElementById("projectImage").src = project.coverImage;

    document.getElementById("projectImage").alt = project.title;

    /* -------------------------
       TAGS
    ------------------------- */

    const tags = document.getElementById("projectTags");

    if (tags) {

        tags.innerHTML = "";

        project.tags.forEach(tag => {

            tags.innerHTML += `<span>${tag}</span>`;

        });

    }

    /* -------------------------
       DOWNLOADS
    ------------------------- */

    const downloads = document.getElementById("downloadButtons");

    if (downloads) {

        downloads.innerHTML = "";

        Object.entries(project.downloads).forEach(([name, file]) => {

            if (file) {

                downloads.innerHTML += `

                <a
                    class="btn-primary"
                    href="${file}"
                    target="_blank">

                    ${name}

                </a>

                `;

            }

        });

    }

    /* -------------------------
       SOFTWARE
    ------------------------- */

    const software = document.getElementById("softwareList");

    if (software && project.software) {

        software.innerHTML = "";

        project.software.forEach(item => {

            software.innerHTML += `<span>${item}</span>`;

        });

    }

    /* -------------------------
       ENGINEERING WORKFLOW
    ------------------------- */

    const workflow = document.getElementById("workflow");

    if (workflow && project.engineeringProcess) {

        workflow.innerHTML = "";

        project.engineeringProcess.forEach(step => {

            workflow.innerHTML += `

            <div class="card">

                ${step}

            </div>

            `;

        });

    }

    /* -------------------------
       PROBLEM
    ------------------------- */

    const problem = document.getElementById("problem");

    if (problem && project.problem) {

        problem.innerText = project.problem;

    }

    /* -------------------------
       SOLUTION
    ------------------------- */

    const solution = document.getElementById("solution");

    if (solution && project.solution) {

        solution.innerText = project.solution;

    }

    /* -------------------------
       GALLERY
    ------------------------- */

    const gallery = document.getElementById("gallery");

    if (gallery && project.gallery) {

        gallery.innerHTML = "";

        project.gallery.forEach(image => {

            gallery.innerHTML += `

            <img
                class="project-image"
                src="${image}"
                alt="${project.title}">

            `;

        });

    }

    /* -------------------------
       EXTERNAL LINKS
    ------------------------- */

    const links = document.getElementById("externalLinks");

    if (links) {

        links.innerHTML = "";

        if (project.github) {

            links.innerHTML += `

            <a
                href="${project.github}"
                target="_blank"
                class="btn-secondary">

                GitHub

            </a>

            `;

        }

        if (project.youtube) {

            links.innerHTML += `

            <a
                href="${project.youtube}"
                target="_blank"
                class="btn-primary">

                Watch on YouTube

            </a>

            `;

        }

    }

}
