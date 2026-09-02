(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Menu mobile */

  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector(".nav");

  if (toggle && navigation) {
    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
      toggle.querySelector(".sr-only").textContent = "Ouvrir le menu";
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      navigation.classList.toggle("is-open", !isOpen);
      toggle.querySelector(".sr-only").textContent = isOpen
        ? "Ouvrir le menu"
        : "Fermer le menu";
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  /* Barre de progression de lecture */

  const progress = document.querySelector("[data-progress]");

  if (progress) {
    let queued = false;

    const paint = () => {
      queued = false;
      const scrollable = root.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      progress.style.width = `${Math.min(ratio, 1) * 100}%`;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!queued) {
          queued = true;
          window.requestAnimationFrame(paint);
        }
      },
      { passive: true }
    );

    paint();
  }

  /* Révélation au défilement et comptage des chiffres */

  const revealTargets = document.querySelectorAll("[data-reveal]");

  const countUp = (element) => {
    const target = Number(element.dataset.count);

    if (!Number.isFinite(target) || reduceMotion.matches) {
      return;
    }

    const duration = 900;
    const start = window.performance.now();

    const step = (now) => {
      const ratio = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      element.textContent = String(Math.round(target * eased));

      if (ratio < 1) {
        window.requestAnimationFrame(step);
      }
    };

    element.textContent = "0";
    window.requestAnimationFrame(step);
  };

  if (revealTargets.length) {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          entry.target.querySelectorAll("[data-count]").forEach(countUp);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    revealTargets.forEach((target) => observer.observe(target));
  }

  /* Fond du héro : champ d'étoiles et globe filaire, en canvas 2D natif.
     Projection orthographique calculée ici plutôt qu'avec une bibliothèque 3D,
     pour ne rien charger de plus au premier rendu. */

  const canvas = document.querySelector("[data-starfield]");

  if (canvas) {
    const ctx = canvas.getContext("2d");
    const stars = [];
    const meridians = 18;
    const parallels = 9;
    const segments = 54;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      stars.length = 0;
      const count = Math.round((width * height) / 9000);

      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.1 + 0.25,
          base: Math.random() * 0.4 + 0.12,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.0012 + 0.0004
        });
      }
    };

    // Projection orthographique d'un point de la sphère après rotation.
    const project = (lat, lon, angle, radius, cx, cy) => {
      const x = Math.cos(lat) * Math.cos(lon + angle);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon + angle);

      return { x: cx + x * radius, y: cy + y * radius, z };
    };

    const strokePath = (points, alpha) => {
      ctx.beginPath();

      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      ctx.strokeStyle = `rgb(249 35 58 / ${alpha}%)`;
      ctx.stroke();
    };

    const drawGlobe = (time) => {
      const radius = Math.min(width, height) * 0.46;
      const cx = width / 2;
      const cy = height / 2;
      const angle = time * 0.00012;

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.5);
      glow.addColorStop(0, "rgb(249 35 58 / 9%)");
      glow.addColorStop(0.55, "rgb(249 35 58 / 3%)");
      glow.addColorStop(1, "rgb(249 35 58 / 0%)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 0.7;

      for (let m = 0; m < meridians; m += 1) {
        const lon = (m / meridians) * Math.PI * 2;
        const points = [];
        let depth = 0;

        for (let s = 0; s <= segments; s += 1) {
          const lat = -Math.PI / 2 + (s / segments) * Math.PI;
          const point = project(lat, lon, angle, radius, cx, cy);
          points.push(point);
          depth += point.z;
        }

        strokePath(points, 9 + (depth / segments + 1) * 14);
      }

      for (let p = 1; p < parallels; p += 1) {
        const lat = -Math.PI / 2 + (p / parallels) * Math.PI;
        const points = [];
        let depth = 0;

        for (let s = 0; s <= segments; s += 1) {
          const lon = (s / segments) * Math.PI * 2;
          const point = project(lat, lon, angle, radius, cx, cy);
          points.push(point);
          depth += point.z;
        }

        strokePath(points, 7 + (depth / segments + 1) * 11);
      }
    };

    const drawStars = (time) => {
      stars.forEach((star) => {
        const twinkle = star.base + Math.sin(time * star.speed + star.phase) * 0.12;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(244 244 247 / ${Math.max(twinkle, 0.04) * 100}%)`;
        ctx.fill();
      });
    };

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);
      drawStars(time);
      drawGlobe(time);
    };

    const loop = (time) => {
      render(time);

      if (visible && !reduceMotion.matches) {
        frame = window.requestAnimationFrame(loop);
      }
    };

    const start = () => {
      window.cancelAnimationFrame(frame);

      if (reduceMotion.matches) {
        render(0);
        return;
      }

      frame = window.requestAnimationFrame(loop);
    };

    resize();
    start();

    window.addEventListener("resize", () => {
      resize();
      start();
    });

    // Le héro sort de l'écran : on arrête la boucle plutôt que de peindre pour rien.
    const heroObserver = new window.IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;

        if (visible) {
          start();
        } else {
          window.cancelAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );

    heroObserver.observe(canvas);
    reduceMotion.addEventListener("change", start);
  }

  /* Liens optionnels : affichés seulement si renseignés dans site.config.js */

  const optionalLinks = document.querySelector("[data-optional-links]");
  const config = window.SITE_CONFIG;

  if (optionalLinks && config) {
    const candidates = [
      { label: "LinkedIn", href: config.linkedinUrl, external: true },
      {
        label: "E-mail",
        href: config.emailAddress ? `mailto:${config.emailAddress}` : "",
        external: false
      },
      { label: "Télécharger le CV", href: config.cvUrl, external: false }
    ];

    candidates
      .filter(({ href }) => typeof href === "string" && href.trim())
      .forEach(({ label, href, external }) => {
        const link = document.createElement("a");
        link.className = "text-link";
        link.href = href;
        link.textContent = label;

        if (external) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }

        optionalLinks.append(link);
      });
  }
})();
