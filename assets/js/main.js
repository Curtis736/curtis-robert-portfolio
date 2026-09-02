(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector(".site-nav");

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
        toggle.focus();
      }
    });
  }

  const optionalLinks = document.querySelector("[data-optional-links]");
  const config = window.SITE_CONFIG;

  if (optionalLinks && config) {
    const candidates = [
      {
        label: "LinkedIn",
        href: config.linkedinUrl,
        external: true
      },
      {
        label: "E-mail",
        href: config.emailAddress ? `mailto:${config.emailAddress}` : "",
        external: false
      },
      {
        label: "Télécharger le CV",
        href: config.cvUrl,
        external: false
      }
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
