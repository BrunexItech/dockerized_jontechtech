import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    // Prevent browser from restoring previous scroll on back/forward
    const previous = window.history.scrollRestoration;
    try { window.history.scrollRestoration = "manual"; } catch {}

    // If there’s a #hash, attempt to scroll to that anchor
    if (hash && hash !== "#") {
      const id = hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return () => { try { window.history.scrollRestoration = previous || "auto"; } catch {} };
      }
    }

    // Scroll common containers, else the document itself
    const candidates = [
      document.querySelector("[data-scroll-container]"),
      document.querySelector("main"),
      document.scrollingElement,
      document.documentElement,
      document.body,
    ].filter(Boolean);

    for (const el of candidates) {
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ top: 0, behavior: "smooth" });
        break;
      }
    }

    return () => {
      try { window.history.scrollRestoration = previous || "auto"; } catch {}
    };
  }, [pathname, hash]);

  return null;
}
