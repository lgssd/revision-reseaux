(function () {
  const KEY = "cahier-erreurs-v1";
  const THEME = "cahier-theme";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
  }

  function logError(entry) {
    const list = load();
    list.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      at: new Date().toISOString(),
      ...entry,
    });
    save(list);
    paintCount();
  }

  function clearJournal() {
    localStorage.removeItem(KEY);
    paintCount();
  }

  function paintCount() {
    const n = load().length;
    document.querySelectorAll("[data-err-count]").forEach((el) => {
      el.textContent = n ? " (" + n + ")" : "";
    });
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById("theme");
    if (btn) btn.textContent = theme === "dark" ? "Mode clair" : "Mode sombre";
  }

  document.getElementById("theme")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME, next);
    applyTheme(next);
  });

  applyTheme(localStorage.getItem(THEME) || "light");
  paintCount();

  window.Journal = { load, logError, clearJournal, paintCount };
})();
