/* ==========================================================
   PORTFOLIO MEDIA HELPERS
   Shared by the public project page and the admin dashboard.
   - safeUrl():       only allows relative paths and http(s) URLs
                      (blocks javascript:, data:, etc.)
   - parseVideoUrl(): recognises uploaded/direct video files,
                      YouTube and Vimeo links
   - videoHTML():     builds a responsive player for one video
   No dependencies.
========================================================== */
(function () {
  "use strict";

  const VIDEO_EXT = /\.(mp4|m4v|webm|ogv)(\?.*)?$/i;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function safeUrl(url) {
    const u = String(url || "").trim();
    if (!u) return "";
    if (/^(https?:)?\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ""; // javascript:, data:, file:, ...
    return u; // relative path inside the site
  }

  function mimeFor(src) {
    if (/\.webm(\?.*)?$/i.test(src)) return "video/webm";
    if (/\.ogv(\?.*)?$/i.test(src)) return "video/ogg";
    return "video/mp4";
  }

  /** Returns { kind: "file"|"youtube"|"vimeo", src } or null if unusable. */
  function parseVideoUrl(url) {
    const u = safeUrl(url);
    if (!u) return null;

    let m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/);
    if (m) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0` };

    m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { kind: "vimeo", src: `https://player.vimeo.com/video/${m[1]}` };

    if (VIDEO_EXT.test(u)) return { kind: "file", src: u };
    return null;
  }

  function captionHTML(v) {
    const title = v.title ? `<strong>${esc(v.title)}</strong>` : "";
    const caption = v.caption ? `<span>${esc(v.caption)}</span>` : "";
    return title || caption ? `<figcaption>${title}${title && caption ? " — " : ""}${caption}</figcaption>` : "";
  }

  /** One video object ({url, title, caption, poster}) -> responsive player markup. */
  function videoHTML(v) {
    const parsed = parseVideoUrl(v && v.url);
    if (!parsed) return "";
    let player;
    if (parsed.kind === "file") {
      const poster = safeUrl(v.poster);
      player =
        `<video controls playsinline preload="metadata"${poster ? ` poster="${esc(poster)}"` : ""}>` +
        `<source src="${esc(parsed.src)}" type="${mimeFor(parsed.src)}">` +
        `Your browser can't play this video. <a href="${esc(parsed.src)}">Download it instead.</a></video>`;
    } else {
      player =
        `<iframe src="${esc(parsed.src)}" title="${esc(v.title || "Project video")}" loading="lazy" ` +
        `allow="fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }
    return `<figure class="media-figure media-figure--video"><div class="video-frame">${player}</div>${captionHTML(v)}</figure>`;
  }

  window.PortfolioMedia = { esc, safeUrl, parseVideoUrl, videoHTML };
})();
