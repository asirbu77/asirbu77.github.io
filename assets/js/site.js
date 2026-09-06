/* Small interactions: copy-to-clipboard email and the news image lightbox. */
(function () {
  "use strict";

  /* --- copy email ------------------------------------------------------- */

  function toast(message) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();

    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.textContent = message;
    document.body.appendChild(el);

    requestAnimationFrame(function () { el.classList.add("is-visible"); });
    setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () { el.remove(); }, 300);
    }, 2600);
  }

  function copyEmail(button) {
    var email = button.getAttribute("data-copy-email");
    if (!email) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(function () {
        toast("Email copied — " + email);
      }, function () {
        window.location.href = "mailto:" + email;
      });
      return;
    }

    var field = document.createElement("textarea");
    field.value = email;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand("copy");
      toast("Email copied — " + email);
    } catch (err) {
      window.location.href = "mailto:" + email;
    }
    field.remove();
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy-email]");
    if (button) {
      event.preventDefault();
      copyEmail(button);
    }
  });

  /* --- scroll affordance ------------------------------------------------ */

  /* Marks a .scroll-box while its list still has content below the fold, so the
     stylesheet can fade the bottom edge and drop the fade at the end. */
  Array.prototype.forEach.call(document.querySelectorAll(".scroller"), function (el) {
    var box = el.parentElement;
    if (!box || !box.classList.contains("scroll-box")) return;

    function update() {
      var slack = el.scrollHeight - el.clientHeight;
      box.classList.toggle("is-scrollable", slack > 2);
      box.classList.toggle("is-end", el.scrollTop >= slack - 2);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  });

  /* --- github star counts ------------------------------------------------ */

  /* The old ghbtns.com iframes were light-only and could not be themed, so the
     counts are fetched directly and rendered in the site's own styles. Results
     are cached for six hours: the unauthenticated API allows 60 calls per hour
     per IP, and a repeat visitor should not spend any of them. */
  var STAR_TTL = 6 * 60 * 60 * 1000;
  var HIDE_ZERO = true;

  function cached(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var hit = JSON.parse(raw);
      return Date.now() - hit.at < STAR_TTL ? hit.n : null;
    } catch (err) {
      return null;
    }
  }

  function remember(key, n) {
    try {
      localStorage.setItem(key, JSON.stringify({ n: n, at: Date.now() }));
    } catch (err) { /* private browsing, or storage full */ }
  }

  function showStars(el, n) {
    if (typeof n !== "number" || (HIDE_ZERO && n === 0)) return;
    var shown = n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
    el.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i>';
    el.appendChild(document.createTextNode(shown));
    el.title = n + (n === 1 ? " star" : " stars") + " on GitHub";
    el.classList.add("is-loaded");
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-repo]"), function (el) {
    var slug = el.getAttribute("data-repo");
    if (!slug) return;

    var key = "gh-stars:" + slug;
    var hit = cached(key);
    if (hit !== null) {
      showStars(el, hit);
      return;
    }

    fetch("https://api.github.com/repos/" + slug)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || typeof data.stargazers_count !== "number") return;
        remember(key, data.stargazers_count);
        showStars(el, data.stargazers_count);
      })
      .catch(function () { /* offline or rate limited: the chip stays hidden */ });
  });

  /* --- lightbox --------------------------------------------------------- */

  var lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  var image = lightbox.querySelector("img");

  function open(src, alt) {
    image.src = src;
    image.alt = alt || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".lightbox__close").focus();
  }

  function close() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    image.removeAttribute("src");
  }

  document.addEventListener("click", function (event) {
    var thumb = event.target.closest("[data-lightbox]");
    if (thumb) {
      open(thumb.getAttribute("src"), thumb.getAttribute("alt"));
      return;
    }
    if (event.target.closest(".lightbox")) close();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) close();
  });
})();
