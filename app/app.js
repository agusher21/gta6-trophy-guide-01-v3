// Leonida Trophy Ledger — plain script, no modules, no network after load.
// State lives only in localStorage under keys starting with "ltl-".
(function () {
  "use strict";

  var EARNED_KEY = "ltl-earned-v1";
  var TARGET_KEY = "ltl-target-v1";
  var SPOILER_KEY = "ltl-spoiler-v1";

  var STAGES = [
    { n: 1, title: "S1 · Arrival", blurb: "Chapter 1. Learn the ropes, and meditate on the balcony at Jason's house before the chapter ends." },
    { n: 2, title: "S2 · Open Leonida", blurb: "Chapter 2. Free roam opens with both protagonists; start scanning vehicles and studying animals." },
    { n: 3, title: "S3 · Vice City", blurb: "Chapter 3. The Cartel Heist, and your first quiet robbery with the Snap Gun." },
    { n: 4, title: "S4 · Top of the World", blurb: "Chapter 4. Three story trophies land here, and an optional mission opens the bank vaults." },
    { n: 5, title: "S5 · Endgame", blurb: "Chapter 5 and the final mission. The credits roll and the 100% checklist appears." },
    { n: 6, title: "S6 · Side Stories", blurb: "Stranger strands and the side characters: Andy, Kenton, Billy, Randy, Tyrone, Bret, and 8 qualifying stranger strands." },
    { n: 7, title: "S7 · Heists & Platinum", blurb: "Clean-up: the 100% checklist, shooting ranges, drone races, collectibles, and the platinum itself." }
  ];

  var trophies = [];
  var byId = {};
  var earned = new Set();
  var target = 55;
  var spoilerOn = false;
  var selectedId = 17; // The Shootist: visible, non-hidden, a good first guide to read.

  var listEl, detailEl, roadmapView, missablesView, missableListEl;

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked: keep going in memory */ }
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function isStoryHidden(t) { return spoilerOn && t.kind === "story" && !earned.has(t.id); }

  function displayName(t) { return isStoryHidden(t) ? "Hidden story trophy" : t.name; }
  function displayDesc(t) { return isStoryHidden(t) ? "Earned it to reveal the story details." : t.description; }

  function stageTrophies(n) { return trophies.filter(function (t) { return t.stage === n; }); }

  function nextUp() {
    for (var s = 1; s <= 7; s++) {
      var rest = stageTrophies(s).filter(function (t) { return !earned.has(t.id); });
      if (rest.length) return rest[0];
    }
    return null;
  }

  function updateGoal() {
    var done = earned.size;
    document.getElementById("goal-count").textContent = done + " / 55";
    document.getElementById("goal-fill").style.width = Math.round(done / 55 * 100) + "%";
    document.getElementById("count-target").textContent = String(target);
    var note = document.getElementById("count-note");
    note.textContent = done >= target
      ? "target of " + target + " reached — raise the bar or go for the platinum"
      : done + " earned of your " + target + " target";
    var nu = nextUp();
    document.getElementById("next-up").textContent = nu
      ? "Next up: " + nu.name + " — " + nu.description
      : "Every trophy is earned. The platinum is yours, Leonida Legend.";
  }

  function currentFilters() {
    return {
      q: (document.getElementById("search").value || "").toLowerCase(),
      kind: document.getElementById("kind-filter").value,
      grade: document.getElementById("grade-filter").value
    };
  }

  function matches(t, f) {
    if (f.kind !== "all" && t.kind !== f.kind) return false;
    if (f.grade !== "all" && t.grade !== f.grade) return false;
    if (f.q) {
      var hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
      if (hay.indexOf(f.q) === -1) return false;
    }
    return true;
  }

  function renderList() {
    var f = currentFilters();
    var shown = trophies.filter(function (t) { return matches(t, f); });
    document.getElementById("list-note").textContent =
      shown.length + " of 55 shown · " + earned.size + " earned";
    listEl.innerHTML = "";
    shown.forEach(function (t) {
      var li = document.createElement("li");
      li.dataset.id = String(t.id);
      if (t.id === selectedId) li.classList.add("selected");
      if (earned.has(t.id)) li.classList.add("earned");
      var flags = "";
      if (t.missable) flags += '<span class="flag missable">MISSABLE</span>';
      if (t.hidden) flags += '<span class="flag hidden">HIDDEN</span>';
      li.innerHTML =
        '<input type="checkbox" class="t-check" ' + (earned.has(t.id) ? "checked" : "") +
        ' aria-label="Mark ' + esc(displayName(t)) + ' as earned">' +
        '<span><span class="t-name">' + esc(displayName(t)) + '</span> ' + flags +
        '<br><span class="t-meta"><span class="grade ' + t.grade + '">' + t.grade + '</span> · ' +
        esc(displayDesc(t)) + '</span></span>';
      li.addEventListener("click", function (ev) {
        if (ev.target.classList.contains("t-check")) return;
        select(t.id);
      });
      var box = li.querySelector(".t-check");
      box.addEventListener("click", function (ev) {
        ev.stopPropagation();
        toggleEarned(t.id);
      });
      listEl.appendChild(li);
    });
  }

  function renderMissables() {
    missableListEl.innerHTML = "";
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      var li = document.createElement("li");
      li.innerHTML = '<span><span class="t-name">' + esc(t.name) + '</span> ' +
        '<span class="flag missable">MISSABLE</span><br><span class="t-meta">' +
        esc(t.description) + ' — meditate at all 18 spots; do the Chapter 1 balcony meditation before Chapter 1 ends.</span></span>';
      li.addEventListener("click", function () { select(t.id); location.hash = "#trophy-" + t.id; });
      missableListEl.appendChild(li);
    });
    document.getElementById("missable-pill").textContent = String(
      trophies.filter(function (t) { return t.missable; }).length);
  }

  function renderDetail() {
    var t = byId[selectedId] || trophies[0];
    if (!t) return;
    var hiddenStory = isStoryHidden(t);
    var srcHtml = t.sources.map(function (s) {
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></li>';
    }).join("");
    var stepsHtml = t.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    detailEl.innerHTML =
      '<div class="detail-head"><h2>' + esc(displayName(t)) + '</h2>' +
      '<span class="grade ' + t.grade + '">' + t.grade + '</span></div>' +
      '<p class="detail-desc">' + esc(displayDesc(t)) + '</p>' +
      (t.missable ? '<p><span class="flag missable">POSSIBLY MISSABLE</span></p>' : '') +
      (t.hidden ? '<p><span class="flag hidden">HIDDEN UNTIL EARNED</span></p>' : '') +
      (hiddenStory
        ? '<p class="spoiler-hidden">Spoilers are hidden. Earn this trophy to reveal its guide, or turn the spoiler setting off.</p>'
        : '<p class="detail-guide">' + esc(t.guide) + '</p>' +
          '<ol class="detail-steps">' + stepsHtml + '</ol>') +
      '<div class="detail-sources"><h3>Sources</h3><ul>' + srcHtml + '</ul>' +
      '<p class="col-note">Guides are written in our own words from these sources, never copied.</p></div>' +
      '<p><a href="#trophy-' + t.id + '">Deep link to this trophy</a> · ' +
      '<button type="button" id="detail-toggle">' + (earned.has(t.id) ? "Mark as not earned" : "Mark as earned") + '</button></p>';
    document.getElementById("detail-toggle").addEventListener("click", function () { toggleEarned(t.id); });
  }

  function renderSources() {
    var seen = {};
    var items = [];
    trophies.forEach(function (t) {
      t.sources.forEach(function (s) {
        if (!seen[s.url]) { seen[s.url] = true; items.push(s); }
      });
    });
    document.getElementById("source-list").innerHTML = items.map(function (s) {
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></li>';
    }).join("");
  }

  function renderRoadmap() {
    var mini = document.getElementById("roadmap-mini");
    mini.innerHTML = STAGES.map(function (st) {
      var done = stageTrophies(st.n).filter(function (t) { return earned.has(t.id); }).length;
      var total = stageTrophies(st.n).length;
      return "<li><strong>" + esc(st.title) + "</strong> — " + done + "/" + total + "</li>";
    }).join("");
    var stagesEl = document.getElementById("roadmap-stages");
    stagesEl.innerHTML = STAGES.map(function (st) {
      var items = stageTrophies(st.n).map(function (t) {
        return "<li>" + (earned.has(t.id) ? "✓ " : "· ") + esc(displayName(t)) + "</li>";
      }).join("");
      return "<li><h3>" + esc(st.title) + "</h3><p class=\"col-note\">" + esc(st.blurb) + "</p><ul>" + items + "</ul></li>";
    }).join("");
  }

  function renderAll() {
    renderList();
    renderDetail();
    renderMissables();
    renderRoadmap();
    updateGoal();
  }

  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id); else earned.add(id);
    saveJSON(EARNED_KEY, Array.from(earned));
    renderAll();
  }

  function select(id) {
    selectedId = id;
    showView("detail");
    renderList();
    renderDetail();
  }

  function showView(view) {
    var isRoadmap = view === "roadmap";
    var isMissables = view === "missables";
    roadmapView.hidden = !isRoadmap;
    missablesView.hidden = !isMissables;
    detailEl.hidden = isRoadmap || isMissables;
    document.getElementById("tab-checklist").classList.toggle("active", !isRoadmap && !isMissables);
    document.getElementById("tab-roadmap").classList.toggle("active", isRoadmap);
    document.getElementById("tab-missables").classList.toggle("active", isMissables);
    document.title = isRoadmap ? "Roadmap — Leonida Trophy Ledger"
      : isMissables ? "Missables — Leonida Trophy Ledger"
      : "Leonida Trophy Ledger — GTA VI Trophy Guide & Tracker";
  }

  function route() {
    var h = location.hash || "#/";
    if (h === "#roadmap") { showView("roadmap"); return; }
    if (h === "#missables") { showView("missables"); return; }
    var m = /^#trophy-(\d+)$/.exec(h);
    if (m && byId[Number(m[1])]) { selectedId = Number(m[1]); showView("detail"); renderList(); renderDetail(); return; }
    showView("detail");
  }

  function exportProgress() {
    var data = { game: "Grand Theft Auto VI", earned: Array.from(earned).sort(function (a, b) { return a - b; }), target: target };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leonida-trophy-ledger-progress.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = Array.isArray(data.earned) ? data.earned : (Array.isArray(data) ? data : null);
        if (!ids) throw new Error("bad file");
        earned = new Set(ids.filter(function (id) { return byId[id]; }));
        if (typeof data.target === "number" && data.target >= 1 && data.target <= 55) target = data.target;
        saveJSON(EARNED_KEY, Array.from(earned));
        saveJSON(TARGET_KEY, target);
        // Show the whole list after an import so the imported progress is visible.
        document.getElementById("search").value = "";
        document.getElementById("kind-filter").value = "all";
        document.getElementById("grade-filter").value = "all";
        renderAll();
      } catch (e) {
        alert("That file is not a Leonida Trophy Ledger export.");
      }
    };
    reader.readAsText(file);
  }

  function init(data) {
    trophies = data.trophies || [];
    trophies.forEach(function (t) { byId[t.id] = t; });
    earned = new Set(loadJSON(EARNED_KEY, []).filter(function (id) { return byId[id]; }));
    var savedTarget = loadJSON(TARGET_KEY, 55);
    if (typeof savedTarget === "number" && savedTarget >= 1 && savedTarget <= 55) target = savedTarget;
    spoilerOn = !!loadJSON(SPOILER_KEY, false);

    listEl = document.getElementById("trophy-list");
    detailEl = document.getElementById("detail");
    roadmapView = document.getElementById("roadmap-view");
    missablesView = document.getElementById("missables-view");
    missableListEl = document.getElementById("missable-list");

    document.getElementById("spoiler").checked = spoilerOn;
    document.getElementById("spoiler").addEventListener("change", function (ev) {
      spoilerOn = ev.target.checked;
      saveJSON(SPOILER_KEY, spoilerOn);
      renderAll();
    });
    document.getElementById("search").addEventListener("input", renderList);
    document.getElementById("kind-filter").addEventListener("change", renderList);
    document.getElementById("grade-filter").addEventListener("change", renderList);
    document.getElementById("count-down").addEventListener("click", function () {
      if (target > 1) { target--; saveJSON(TARGET_KEY, target); updateGoal(); }
    });
    document.getElementById("count-up").addEventListener("click", function () {
      if (target < 55) { target++; saveJSON(TARGET_KEY, target); updateGoal(); }
    });
    document.getElementById("export-btn").addEventListener("click", exportProgress);
    document.getElementById("import-file").addEventListener("change", function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = "";
    });
    document.getElementById("reset-btn").addEventListener("click", function () {
      if (confirm("Clear all earned trophies?")) {
        earned = new Set();
        saveJSON(EARNED_KEY, []);
        renderAll();
      }
    });
    window.addEventListener("hashchange", route);

    renderSources();
    renderAll();
    route();
  }

  fetch("data/trophies.json")
    .then(function (r) { return r.json(); })
    .then(init)
    .catch(function () {
      document.getElementById("detail").innerHTML =
        "<p>Could not load the trophy data. Open this guide from its own folder so data/trophies.json loads.</p>";
    });
})();
