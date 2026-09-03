/* ============================================================
   MAIN — business config binding, mobile nav, scroll reveal,
          image fallbacks, sticky bar, subtle hero parallax.

   Plain browser JavaScript. No build step, no dependencies —
   which also means index.html works when opened directly
   from the file system.
   ============================================================ */

(function () {
  "use strict";

  var cfg = window.BUSINESS || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     1. Apply business details from config.js
     ---------------------------------------------------------- */

  function buildWhatsAppUrl() {
    var number = String(cfg.whatsapp || "").replace(/\D/g, "");
    var url = "https://wa.me/" + number;
    if (cfg.whatsappMessage) {
      url += "?text=" + encodeURIComponent(cfg.whatsappMessage);
    }
    return url;
  }

  function buildInstagramUrl() {
    return "https://instagram.com/" + String(cfg.instagram || "").replace(/^@/, "");
  }

  function applyConfig() {
    var waUrl = buildWhatsAppUrl();
    var igUrl = buildInstagramUrl();

    document.querySelectorAll('[data-link="whatsapp"]').forEach(function (el) {
      el.href = waUrl;
    });
    document.querySelectorAll('[data-link="instagram"]').forEach(function (el) {
      el.href = igUrl;
    });

    // Text bindings. The key "instagramHandle" is derived, not stored.
    var values = {
      name: cfg.name,
      tagline: cfg.tagline,
      whatsappDisplay: cfg.whatsappDisplay,
      city: cfg.city,
      hours: cfg.hours,
      instagramHandle: cfg.instagram ? "@" + String(cfg.instagram).replace(/^@/, "") : ""
    };

    document.querySelectorAll("[data-business]").forEach(function (el) {
      var value = values[el.getAttribute("data-business")];
      if (value) el.textContent = value;
    });

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ----------------------------------------------------------
     2. Image fallbacks
     If a photo has not been added yet, hide the broken <img>
     so the decorative gradient tile behind it shows instead.
     ---------------------------------------------------------- */

  function markEmpty(img) {
    var frame = img.closest(".media, .ig-tile, .brand__mark");
    if (frame) frame.classList.add("is-empty");
  }

  function setupImageFallbacks() {
    document.querySelectorAll(".media img, .ig-tile img, .brand__mark img").forEach(function (img) {
      img.addEventListener("error", function () { markEmpty(img); });

      // Images may have already failed before this script ran.
      if (img.complete && img.naturalWidth === 0) markEmpty(img);
    });
  }

  /* ----------------------------------------------------------
     2b. Story video
     Same fallback contract as the images: if it cannot play, the
     frame is marked empty and the emoji shows instead. Autoplay is
     dropped when motion is not wanted -- the poster stays put and
     controls appear, so the video is still reachable on purpose.
     ---------------------------------------------------------- */

  function setupVideo() {
    document.querySelectorAll(".media video").forEach(function (video) {
      video.addEventListener("error", function () { markEmpty(video); });

      if (reduceMotion) {
        video.removeAttribute("autoplay");
        video.autoplay = false;
        video.loop = false;
        video.controls = true;
        video.pause();
      }
    });
  }

  /* ----------------------------------------------------------
     3. Mobile navigation
     ---------------------------------------------------------- */

  function setupNav() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("navMenu");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close after picking a destination.
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });

    // Escape closes the menu and returns focus to the button.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset state if the viewport grows past the mobile breakpoint
    // (a rotation counts). Must match the 960px query in layout.css.
    var desktop = window.matchMedia("(min-width: 961px)");
    var onDesktopChange = function (e) { if (e.matches) setOpen(false); };

    if (desktop.addEventListener) {
      desktop.addEventListener("change", onDesktopChange);
    } else if (desktop.addListener) {
      desktop.addListener(onDesktopChange);   // older Safari
    }
  }

  /* ----------------------------------------------------------
     4. Scroll reveal
     ---------------------------------------------------------- */

  function setupReveal() {
    var items = document.querySelectorAll("[data-reveal]");

    // No IntersectionObserver, or motion is not wanted: show everything.
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);   // reveal once, then stop watching
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ----------------------------------------------------------
     5. Navbar shadow + mobile sticky contact bar
     Both driven by one scroll listener, throttled with rAF.
     ---------------------------------------------------------- */

  function setupScrollEffects() {
    var navbar = document.getElementById("navbar");
    var bar = document.getElementById("stickyBar");
    var hero = document.getElementById("top");
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;

      if (navbar) navbar.classList.toggle("is-scrolled", y > 12);

      if (bar) {
        // Appear once the visitor has scrolled past the hero's buttons.
        var trigger = hero ? hero.offsetHeight * 0.6 : 420;
        var show = y > trigger;
        bar.classList.toggle("is-visible", show);
        bar.setAttribute("aria-hidden", String(!show));
        // Keep hidden controls out of the tab order.
        bar.querySelectorAll("a").forEach(function (a) {
          a.setAttribute("tabindex", show ? "0" : "-1");
        });
      }

      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ----------------------------------------------------------
     6. Subtle hero parallax (desktop, motion-friendly only)
     ---------------------------------------------------------- */

  function setupParallax() {
    var el = document.querySelector("[data-parallax]");
    if (!el || reduceMotion) return;

    // Evaluated live, not once at load: rotating a tablet or resizing a
    // window has to be able to turn the effect on and off.
    var wide = window.matchMedia("(min-width: 981px)");
    var ticking = false;

    function update() {
      if (!wide.matches) {
        // Clear any offset left behind when the viewport narrowed.
        if (el.style.transform) el.style.transform = "";
        ticking = false;
        return;
      }
      var y = window.scrollY || window.pageYOffset;
      // Small offset — enough to feel alive, not enough to distract.
      var shift = Math.min(y * 0.06, 34);
      el.style.transform = "translate3d(0," + shift + "px,0)";
      ticking = false;
    }

    function request() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", request, { passive: true });

    if (wide.addEventListener) {
      wide.addEventListener("change", request);
    } else if (wide.addListener) {
      wide.addListener(request);              // older Safari
    }

    update();
  }

  /* ----------------------------------------------------------
     Init
     ---------------------------------------------------------- */

  function init() {
    applyConfig();
    setupImageFallbacks();
    setupVideo();
    setupNav();
    setupReveal();
    setupScrollEffects();
    setupParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
