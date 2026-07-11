# Lewis Mutwiri — Engineering Portfolio

Static, JSON-driven portfolio site. "Drafting Table" design system:
blueprint linework, vellum type, ISO-style title blocks.

## Structure

```
index.html            Home
robotics.html          Robotics & Automation
cad.html                CAD
cam.html                CAM
cae.html                CAE
portfolio.html         Full searchable/filterable project index
projects.html          Project case-study template (?id=<slug>)
about.html             About
contact.html           Contact form
404.html                Not-found page
projects.json           All project data — single source of truth
assets/css/style.css    Design system
assets/js/script.js     UI behaviour (theme, nav, reveal animation)
assets/js/projects.js   Fetches projects.json and renders every grid
assets/images/          Photos, renders, gallery images
assets/resumes/         Downloadable CVs
```

## Adding a project

Add an object to the relevant array in `projects.json` (`cad`, `cam`,
`cae`, `robotics`, `embedded`, `manufacturing`). Every field maps
directly to the case-study template in `projects.html` and to the
compact cards rendered on the home, discipline and portfolio pages.
No HTML or JS changes are required — this is what keeps the site
compatible with a future `admin.html` project generator.

Required fields: `slug`, `title`, `category`, `coverImage`.
Everything else (`subtitle`, `status`, `difficulty`, `duration`,
`software`, `engineeringProcess`, `problem`, `solution`, `gallery`,
`downloads`, `tags`, `youtube`, `github`, `featured`) is optional —
omitted sections simply don't render.

## Notes

- `sitemap.xml` and `robots.txt` use a placeholder domain
  (`lewismutwiri.com`) — swap in your real domain once you have one.
- `assets/images/`, `assets/resumes/` are not included here; keep
  using your existing folders alongside these files.
