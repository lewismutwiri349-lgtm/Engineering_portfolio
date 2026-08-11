# Lewis Mutwiri — Engineering Portfolio

A static, JSON-driven engineering portfolio built for Cloudflare Pages. No build step, no framework — plain HTML/CSS/JS so it stays fast and easy to maintain.

## Structure

```
/
├── index.html            Home
├── robotics.html         Robotics & Automation
├── cad-cam-cae.html      DFMA • FEA • CFD
├── portfolio.html        Full project list (search + filter)
├── projects.html         Project detail (reads ?id= from the URL)
├── about.html
├── contact.html
├── 404.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css
    ├── js/script.js
    ├── data/projects.json   ← single source of truth for every project
    ├── images/               (SVG placeholders — see "Placeholder art" below)
    └── resumes/               (PDFs referenced by download buttons — see note below)
```

## Linking skills to projects

Every skill chip on `about.html` links to `portfolio.html?skill=<slug>` (e.g. `?skill=cfd`), which filters the portfolio grid to projects tagged with that skill. To connect a project to a skill, add a `skills` array to its entry in `projects.json`:

```json
"skills": ["mechanical-design", "machine-design"]
```

The full list of recognised slugs lives in `SKILLS` at the top of `assets/js/script.js` — add a new skill there (and as a chip in `about.html`) before tagging a project with it. A skill with no projects tagged yet shows a plain "nothing here yet" message rather than an error, so it's safe to link a skill before you've written up the first project for it.

## Adding or editing a project

Every project card and detail page is generated from **`assets/data/projects.json`**. To add a project, add an object to the array:

```json
{
  "id": "unique-url-slug",
  "title": "Project Title",
  "category": "dfma | fea | cfd | robotics",
  "featured": true,
  "thumbnail": "assets/images/your-image.jpg",
  "summary": "One or two sentence summary shown on cards.",
  "tags": ["Tag One", "Tag Two"],
  "software": ["SolidWorks", "ANSYS"],
  "process": ["Step One", "Step Two"],
  "problem": "The engineering problem, in a sentence or two.",
  "solution": "How you solved it.",
  "gallery": ["assets/images/img1.jpg", "assets/images/img2.jpg"],
  "downloads": [{ "label": "Drawing Pack (PDF)", "url": "assets/downloads/file.pdf" }],
  "links": [{ "label": "View on GitHub", "url": "https://github.com/..." }]
}
```

`category` controls which page(s) a project appears on (`robotics.html` shows `robotics`; `cad-cam-cae.html` shows `dfma`/`fea`/`cfd`). `featured: true` projects appear on the homepage (first three). Everything appears on `portfolio.html`, searchable and filterable.

Project detail pages are reached at `projects.html?id=your-slug` — the link is generated automatically by the card renderer in `assets/js/script.js`.

## Placeholder art

`assets/images/cad1–6.svg` and `robot1–6.svg` are branded placeholder graphics (blueprint-style, generated for this pass) standing in for real project photography/renders. Swap them for real photos or SolidWorks renders by replacing the file at the same path, or updating the path in `projects.json`. `hero-bird.svg` is the hero background artwork — see the design notes in the handoff summary for why it's vector rather than a photograph.

## Resumes

`contact.html`, `index.html`, `cad-cam-cae.html` and `robotics.html` link to `assets/resumes/General_CV.pdf`, `DFMA_FEA_CFD_CV.pdf` and `Robotics_CV.pdf`. These files aren't included — add your actual PDFs at those paths (create the `assets/resumes/` folder) so the download buttons work.

## Local preview

Because `script.js` fetches `assets/data/projects.json`, opening the HTML files directly via `file://` will fail (browsers block `fetch` on local files by CORS). Serve the folder instead:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to Cloudflare Pages

Point Cloudflare Pages at this folder as the build output directory with no build command — it's already static.
