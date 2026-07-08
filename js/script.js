/* ==========================
   THEME TOGGLE
========================== */

const themeButton = document.getElementById("themeToggle");

const currentTheme = localStorage.getItem("theme");

if (currentTheme === "light") {
    document.body.classList.add("light-mode");
    if (themeButton) themeButton.textContent = "☀️";
}

if (themeButton) {

    themeButton.addEventListener("click", () => {

        document.body.classList.toggle("light-mode");

        if (document.body.classList.contains("light-mode")) {

            localStorage.setItem("theme", "light");
            themeButton.textContent = "☀️";

        } else {

            localStorage.setItem("theme", "dark");
            themeButton.textContent = "🌙";

        }

    });

}

/* ==========================
   ACTIVE NAVIGATION
========================== */

const navLinks = document.querySelectorAll(".nav-links a");

navLinks.forEach(link => {

    if (link.href === window.location.href) {

        link.style.color = "#1E88E5";
        link.style.fontWeight = "600";

    }

});

/* ==========================
   CARD FADE-IN
========================== */

const cards = document.querySelectorAll(".card");

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

        }

    });

}, {
    threshold: 0.15
});

cards.forEach(card => observer.observe(card));

/* ==========================
   PARALLAX HERO
========================== */

window.addEventListener("scroll", () => {

    const hero = document.querySelector(".hero");

    if (hero) {

        hero.style.backgroundPositionY =
            window.scrollY * 0.3 + "px";

    }

});

/* ==========================
   SMOOTH SCROLL
========================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {

            target.scrollIntoView({

                behavior: "smooth"

            });

        }

    });

});
