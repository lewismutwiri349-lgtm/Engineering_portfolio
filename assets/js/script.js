/* ==========================================================
   UI BEHAVIOURS
   Theme toggle · sticky header · mobile nav · active link
   · card reveal-on-scroll · smooth scroll
========================================================== */

(function () {

    /* ------------------------------------------------------
       THEME TOGGLE
    ------------------------------------------------------ */
    const themeButton = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }

    function syncThemeButton() {
        if (!themeButton) return;
        const isLight = document.body.classList.contains("light-mode");
        themeButton.textContent = isLight ? "☀️" : "🌙";
        themeButton.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    }

    syncThemeButton();

    if (themeButton) {
        themeButton.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");
            localStorage.setItem(
                "theme",
                document.body.classList.contains("light-mode") ? "light" : "dark"
            );
            syncThemeButton();
        });
    }

    /* ------------------------------------------------------
       MOBILE NAV
    ------------------------------------------------------ */
    const navToggle = document.getElementById("navToggle");
    const navLinksEl = document.getElementById("navLinks");

    if (navToggle && navLinksEl) {
        navToggle.addEventListener("click", () => {
            const isOpen = navLinksEl.classList.toggle("is-open");
            navToggle.setAttribute("aria-expanded", String(isOpen));
        });

        navLinksEl.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinksEl.classList.remove("is-open");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    /* ------------------------------------------------------
       STICKY HEADER SHADOW
    ------------------------------------------------------ */
    const header = document.querySelector(".site-header");

    function syncHeaderShadow() {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    syncHeaderShadow();
    window.addEventListener("scroll", syncHeaderShadow, { passive: true });

    /* ------------------------------------------------------
       ACTIVE NAVIGATION LINK
       (matches on pathname so query strings don't break it)
    ------------------------------------------------------ */
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav-links a").forEach(link => {
        const linkPath = link.getAttribute("href").split("/").pop();
        if (linkPath === currentPath) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
    });

    /* ------------------------------------------------------
       CARD REVEAL ON SCROLL
       Exposed globally so dynamically-injected cards
       (rendered from projects.json) can re-trigger it.
    ------------------------------------------------------ */
    let revealObserver;

    function initCardReveal(scope = document) {
        if (!revealObserver) {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("show");
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12 });
        }

        scope.querySelectorAll(".card:not(.show)").forEach(card => revealObserver.observe(card));
    }

    window.initCardReveal = initCardReveal;
    initCardReveal();

    /* ------------------------------------------------------
       SMOOTH SCROLL FOR IN-PAGE ANCHORS
    ------------------------------------------------------ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (targetId.length < 2) return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                target.setAttribute("tabindex", "-1");
                target.focus({ preventScroll: true });
            }
        });
    });

})();
