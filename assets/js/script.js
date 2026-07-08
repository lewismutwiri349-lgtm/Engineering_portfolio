/* ==========================
   THEME
========================== */

const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    if (themeToggle) themeToggle.textContent = "☀️";
}

themeToggle?.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {

        localStorage.setItem("theme", "light");
        themeToggle.textContent = "☀️";

    } else {

        localStorage.setItem("theme", "dark");
        themeToggle.textContent = "🌙";

    }

});

/* ==========================
   LOAD PROJECTS
========================== */

async function loadProjects() {

    const roboticsContainer = document.getElementById("roboticsProjects");

    const cadContainer = document.getElementById("cadProjects");

    try {

        const response = await fetch("data/projects.json");

        const data = await response.json();

        if (roboticsContainer) {

            data.robotics.forEach(project => {

                roboticsContainer.innerHTML += createCard(project);

            });

        }

        if (cadContainer) {

            data.cad.forEach(project => {

                cadContainer.innerHTML += createCard(project);

            });

        }

    }

    catch(error){

        console.error(error);

    }

}

function createCard(project){

return `

<div class="card">

<img src="${project.image}" class="project-image">

<h3>${project.title}</h3>

<p>${project.description}</p>

<div class="tag-list">

${project.tags.map(tag=>`<span>${tag}</span>`).join("")}

</div>

<div class="project-buttons">

<a href="${project.report}" class="btn-primary">

Report

</a>

<a href="${project.github}" class="btn-secondary">

GitHub

</a>

</div>

</div>

`;

}

loadProjects();
