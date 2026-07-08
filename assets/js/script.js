/* ==========================================
   THEME TOGGLE
========================================== */

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {

    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light-mode");
        themeToggle.textContent = "☀️";
    }

    themeToggle.addEventListener("click", () => {

        document.body.classList.toggle("light-mode");

        if (document.body.classList.contains("light-mode")) {

            localStorage.setItem("theme", "light");
            themeToggle.textContent = "☀️";

        } else {

            localStorage.setItem("theme", "dark");
            themeToggle.textContent = "🌙";

        }

    });

}


/* ==========================================
   LOAD JSON
========================================== */

async function getProjects() {

    const response = await fetch("data/projects.json");

    const data = await response.json();

    return [

        ...data.robotics,
        ...data.cad,
        ...data.cam,
        ...data.cae,
        ...data.embedded,
        ...data.manufacturing

    ];

}


/* ==========================================
   CREATE CARD
========================================== */

function createCard(project){

return `

<div class="card">

<img
class="project-image"
src="${project.coverImage}"
alt="${project.title}">

<h3>${project.title}</h3>

<h4>${project.subtitle}</h4>

<p>${project.description}</p>

<div class="tag-list">

${project.tags.map(tag=>`<span>${tag}</span>`).join("")}

</div>

<div class="project-buttons">

<a
class="btn-primary"
href="project.html?id=${project.slug}">

Open Project

</a>

</div>

</div>

`;

}


/* ==========================================
   FEATURED PROJECTS
========================================== */

async function loadFeaturedProjects(){

const container=document.getElementById("featuredProjects");

if(!container) return;

const projects=await getProjects();

projects

.filter(project=>project.featured)

.forEach(project=>{

container.innerHTML+=createCard(project);

});

}


/* ==========================================
   ROBOTICS PAGE
========================================== */

async function loadRobotics(){

const container=document.getElementById("roboticsProjects");

if(!container) return;

const projects=await getProjects();

projects

.filter(project=>project.category==="robotics")

.forEach(project=>{

container.innerHTML+=createCard(project);

});

}


/* ==========================================
   CAD PAGE
========================================== */

async function loadCAD(){

const container=document.getElementById("cadProjects");

if(!container) return;

const projects=await getProjects();

projects

.filter(project=>

project.category==="cad" ||

project.category==="cam" ||

project.category==="cae"

)

.forEach(project=>{

container.innerHTML+=createCard(project);

});

}


/* ==========================================
   PORTFOLIO
========================================== */

async function loadPortfolio(){

const container=document.getElementById("portfolioProjects");

if(!container) return;

const projects=await getProjects();

projects.forEach(project=>{

container.innerHTML+=createCard(project);

});

}


/* ==========================================
   PROJECT PAGE
========================================== */

async function loadProject(){

const title=document.getElementById("projectTitle");

if(!title) return;

const params=new URLSearchParams(window.location.search);

const slug=params.get("id");

const projects=await getProjects();

const project=projects.find(p=>p.slug===slug);

if(!project){

title.innerText="Project Not Found";

return;

}

document.title=project.title;

document.getElementById("projectTitle").innerText=project.title;

document.getElementById("projectDescription").innerText=project.description;

document.getElementById("projectImage").src=project.coverImage;

const tags=document.getElementById("projectTags");

tags.innerHTML="";

project.tags.forEach(tag=>{

tags.innerHTML+=`<span>${tag}</span>`;

});

const downloads=document.getElementById("downloadButtons");

downloads.innerHTML="";

Object.entries(project.downloads).forEach(([name,file])=>{

if(file!=""){

downloads.innerHTML+=`

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


/* ==========================================
   SEARCH
========================================== */

async function enableSearch(){

const search=document.getElementById("searchBox");

if(!search) return;

const container=document.getElementById("portfolioProjects");

const projects=await getProjects();

search.addEventListener("keyup",()=>{

const text=search.value.toLowerCase();

container.innerHTML="";

projects

.filter(project=>

project.title.toLowerCase().includes(text) ||

project.description.toLowerCase().includes(text) ||

project.tags.join(" ").toLowerCase().includes(text)

)

.forEach(project=>{

container.innerHTML+=createCard(project);

});

});

}


/* ==========================================
   START
========================================== */

loadFeaturedProjects();

loadRobotics();

loadCAD();

loadPortfolio();

loadProject();

enableSearch();
