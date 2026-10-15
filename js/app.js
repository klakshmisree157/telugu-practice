
/*
  js/app.js
  Home screen, levels, practice/test selection,
  progress tracking, and floating decorations.
*/

"use strict";

const $ = selector => document.querySelector(selector);
const app = $("#app");

/* ==========================================
   SAVE PROGRESS ON THIS DEVICE
========================================== */

let st = {};

try {
  st = JSON.parse(localStorage.getItem("tg") || "{}");

  if (!st || typeof st !== "object" || Array.isArray(st)) {
    st = {};
  }
} catch (error) {
  st = {};
}

function save() {
  try {
    localStorage.setItem("tg", JSON.stringify(st));
  } catch (error) {
    console.warn("Progress could not be saved.", error);
  }
}

/* ==========================================
   FLOATING DECORATIONS
========================================== */

function createDecorations() {
  const container = $("#fl");

  if (!container || container.dataset.ready === "true") {
    return;
  }

  container.dataset.ready = "true";

  const decorations = [
    "🦋", "⭐", "🌼", "☁️", "🌈",
    "✨", "🐝", "🍃", "🌸", "💫"
  ];

  decorations.forEach((symbol, index) => {
    const item = document.createElement("span");

    item.textContent = symbol;
    item.style.left = `${(index * 37 + 9) % 96}%`;
    item.style.animationDuration = `${14 + (index % 5) * 3}s`;
    item.style.animationDelay = `${-(index * 2.4)}s`;

    container.appendChild(item);
  });
}

/* ==========================================
   LEVEL ICONS
========================================== */

function levelIcon(index) {
  const icons = ["🌱", "🌿", "🌳", "🌈"];
  return icons[index] || "🌼";
}

/* ==========================================
   PROGRESS HELPERS
========================================== */

function getLevelProgress(definition) {
  const words = ALL.filter(definition.filter);

  const completed = words.filter(
    word => st[word.w] === 1
  ).length;

  return {
    total: words.length,
    completed,
    percentage: words.length
      ? Math.round((completed / words.length) * 100)
      : 0
  };
}

function getOverallProgress() {
  const completed = ALL.filter(
    word => st[word.w] === 1
  ).length;

  return {
    completed,
    total: ALL.length,
    percentage: ALL.length
      ? Math.round((completed / ALL.length) * 100)
      : 0
  };
}

/* ==========================================
   HOME SCREEN
========================================== */

function home() {
  createDecorations();

  const overall = getOverallProgress();

  app.innerHTML = `
    <header class="center section">
      <div class="mas" aria-label="చిలుక">🦜</div>

      <h1>అక్షరాల తోట</h1>

      <p>ఆడుతూ నేర్చుకుందాం!</p>
    </header>

    <section class="card">
      <h2>🌻 మీ అభ్యాస ప్రయాణం</h2>

      <p>
        ఒక్కో పదాన్ని నేర్చుకుంటూ మీ అక్షరాల తోటను
        పెంచుకోండి!
      </p>

      <div class="two">
        <div>
          <strong>${overall.completed}</strong>
          <p>నేర్చుకున్న పదాలు</p>
        </div>

        <div>
          <strong>${overall.total}</strong>
          <p>మొత్తం పదాలు</p>
        </div>
      </div>

      <progress
        value="${overall.completed}"
        max="${Math.max(overall.total, 1)}"
        aria-label="మొత్తం అభ్యాస ప్రగతి"
      ></progress>

      <p class="center">
        ${overall.percentage}% పూర్తయింది
      </p>
    </section>

    <section class="section">
      <h2>🌷 మీ స్థాయిని ఎంచుకోండి</h2>

      <p>మీకు నచ్చిన స్థాయి నుంచి సాధన మొదలుపెట్టండి.</p>

      <div class="levels">
        ${LV.map((item, index) => {
          const progress = getLevelProgress(item);

          return `
            <button
              type="button"
              class="level-card"
              data-level="${item.id}"
            >
              <div style="font-size:36px;margin-bottom:6px">
                ${levelIcon(index)}
              </div>

              <h3>${item.name}</h3>

              <p>${item.description || ""}</p>

              <small>
                ⭐ ${progress.completed} / ${progress.total} పదాలు
              </small>

              <progress
                value="${progress.completed}"
                max="${Math.max(progress.total, 1)}"
                aria-label="${item.name} ప్రగతి"
              ></progress>
            </button>
          `;
        }).join("")}
      </div>
    </section>

    <section class="center section">
      <button
        type="button"
        class="secondary"
        id="reset-all"
      >
        🔄 మొత్తం ప్రగతిని రీసెట్ చేయండి
      </button>

    </section>
  `;

  app.querySelectorAll("[data-level]").forEach(button => {
    button.addEventListener("click", () => {
      level(Number(button.dataset.level));
    });
  });

  $("#reset-all").addEventListener("click", resetAll);
}

/* ==========================================
   LEVEL SCREEN
========================================== */

function level(levelId) {
  const definition = LV.find(item => item.id === levelId);

  if (!definition) {
    home();
    return;
  }

  const words = ALL.filter(definition.filter);
  const progress = getLevelProgress(definition);

  app.innerHTML = `
    <button type="button" class="back" id="back-home">
      ← హోమ్‌కు వెళ్లండి
    </button>

    <header class="center section">
      <div class="mas">${levelIcon(LV.indexOf(definition))}</div>

      <h1>${definition.name}</h1>

      <p>${definition.description || "పదాలను నేర్చుకుందాం!"}</p>
    </header>

    <section class="card">
      <h2>🌼 మీ ప్రగతి</h2>

      <p>
        ${progress.completed} / ${progress.total} పదాలు నేర్చుకున్నారు
      </p>

      <progress
        value="${progress.completed}"
        max="${Math.max(progress.total, 1)}"
      ></progress>
    </section>

    <section class="card">
      <h2>ఏమి చేద్దాం?</h2>

      <p>ముందుగా సాధన చేసి, ఆ తర్వాత మీకు మీరే పరీక్ష పెట్టుకోండి.</p>

      <button type="button" class="big" id="practice">
        🌱 సాధన చేద్దాం
      </button>

      <button type="button" class="big" id="test">
        ⭐ పరీక్ష రాయండి
      </button>

      <button type="button" class="secondary" id="reset-level">
        🔄 ఈ స్థాయి ప్రగతిని రీసెట్ చేయండి
      </button>
    </section>

    <section class="center">
      <p>ఈ స్థాయిలో ${words.length} పదాలు ఉన్నాయి.</p>
    </section>
  `;

  $("#back-home").addEventListener("click", home);

  $("#practice").addEventListener("click", () => {
    pick(levelId, false);
  });

  $("#test").addEventListener("click", () => {
    pick(levelId, true);
  });

  $("#reset-level").addEventListener("click", () => {
    const confirmed = confirm(
      "ఈ స్థాయి ప్రగతిని రీసెట్ చేయాలా?"
    );

    if (!confirmed) return;

    words.forEach(word => {
      delete st[word.w];
    });

    save();
    level(levelId);
  });
}

/* ==========================================
   CHOOSE QUESTION COUNT
========================================== */

function pick(levelId, isTest) {
  const definition = LV.find(item => item.id === levelId);

  if (!definition) {
    home();
    return;
  }

  const available = ALL.filter(definition.filter);

  if (available.length === 0) {
    alert("ఈ స్థాయిలో పదాలు అందుబాటులో లేవు.");
    level(levelId);
    return;
  }

  const requested = prompt(
    `ఎన్ని పదాలతో ${isTest ? "పరీక్ష" : "సాధన"} చేయాలనుకుంటున్నారు?\n\n` +
    `1 నుంచి ${available.length} వరకు సంఖ్య ఇవ్వండి.`,
    String(Math.min(10, available.length))
  );

  if (requested === null) return;

  const count = Number(requested);

  if (!Number.isInteger(count) || count < 1) {
    alert("దయచేసి సరైన సంఖ్యను ఇవ్వండి.");
    return;
  }

  play(
    levelId,
    Math.min(count, available.length),
    isTest
  );
}

/* ==========================================
   RESET ALL PROGRESS
========================================== */

function resetAll() {
  const confirmed = confirm(
    "మీరు నేర్చుకున్న అన్ని పదాల ప్రగతిని తొలగించాలా?"
  );

  if (!confirmed) return;

  st = {};
  save();
  home();
}

/* ==========================================
   START APPLICATION
========================================== */

home();
