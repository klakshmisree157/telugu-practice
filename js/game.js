
/*
  js/game.js
  Telugu word-building game:
  - Practice and test modes
  - Animated letter tiles
  - Hints and undo
  - Answer checking and scoring
  - Local progress saving
  - Celebration effects
*/

"use strict";

function play(levelId, questionCount, isTest) {
  const definition = LV.find(item => item.id === levelId);

  if (!definition) {
    home();
    return;
  }

  const availableWords = ALL.filter(definition.filter);

  if (availableWords.length === 0) {
    alert("ఈ స్థాయిలో పదాలు అందుబాటులో లేవు.");
    level(levelId);
    return;
  }

  questionCount = Math.max(
    1,
    Math.min(
      Number(questionCount) || 1,
      availableWords.length
    )
  );

  /* ------------------------------------------
     SHUFFLE
  ------------------------------------------ */

  function shuffle(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  const questions = shuffle(availableWords).slice(0, questionCount);

  let questionIndex = 0;
  let score = 0;
  let answered = 0;

  let current = null;
  let selected = [];
  let checked = false;
  let currentCorrect = false;
  let hintUsed = false;
  let feedbackMessage = "";

  showQuestion();

  /* ------------------------------------------
     SHOW QUESTION
  ------------------------------------------ */

  function showQuestion() {
    const word = questions[questionIndex];

    current = {
      ...word,
      chunks: shuffle(word.t)
    };

    selected = [];
    checked = false;
    currentCorrect = false;
    hintUsed = false;
    feedbackMessage = "";

    render();
  }

  /* ------------------------------------------
     RENDER GAME SCREEN
  ------------------------------------------ */

  function render() {
    const total = questions.length;
    const number = questionIndex + 1;
    const percentage = Math.round((number / total) * 100);

    app.innerHTML = `
      <button
        type="button"
        class="back"
        id="exit-game"
      >
        ← వెనక్కి వెళ్లండి
      </button>

      <header class="center section">
        <div class="mas" id="mascot" aria-hidden="true">🦜</div>

        <h1>${definition.name}</h1>

        <p>
          ${isTest ? "⭐ పరీక్ష సమయం!" : "🌱 పదాన్ని తయారు చేద్దాం!"}
        </p>

        <p>
          ప్రశ్న ${number} / ${total}
        </p>

        <progress
          value="${number}"
          max="${total}"
          aria-label="ప్రశ్నల ప్రగతి"
        ></progress>
      </header>

      <section class="card">
        <div class="center">
          <div class="stars" aria-hidden="true">🌼 ⭐ 🌼</div>

          <h2>అక్షర భాగాలను సరైన క్రమంలో అమర్చండి</h2>

          <p>
            కింద ఉన్న భాగాలను నొక్కి పదాన్ని తయారు చేయండి.
          </p>
        </div>

        <div
          class="slots ${checked ? (currentCorrect ? "ok" : "bad") : ""}"
          id="answer-slots"
          aria-label="మీ సమాధానం"
        >
          ${
            selected.length
              ? selected.map((item, index) => `
                  <button
                    type="button"
                    class="t"
                    data-remove="${index}"
                    ${checked ? "disabled" : ""}
                    aria-label="${item.value} తొలగించండి"
                  >
                    ${item.value}
                  </button>
                `).join("")
              : `<span class="muted">మీ పదం ఇక్కడ కనిపిస్తుంది ✨</span>`
          }
        </div>

        <div
          class="pool"
          id="chunk-pool"
          aria-label="ఎంచుకోవాల్సిన అక్షర భాగాలు"
        >
          ${current.chunks.map((chunk, index) => {
            const used = selected.some(item => item.index === index);

            return `
              <button
                type="button"
                class="t"
                data-chunk="${index}"
                ${used || checked ? "disabled" : ""}
                aria-label="${chunk} ఎంచుకోండి"
              >
                ${chunk}
              </button>
            `;
          }).join("")}
        </div>

        <div
          class="msg"
          id="feedback"
          role="status"
          aria-live="polite"
        >
          ${feedbackMessage}
        </div>

        <div class="actions">
          <button
            type="button"
            class="secondary"
            id="undo"
            ${selected.length === 0 || checked ? "disabled" : ""}
          >
            ↩ వెనక్కి
          </button>

          <button
            type="button"
            class="secondary"
            id="hint"
            ${checked ? "disabled" : ""}
          >
            💡 సూచన
          </button>

          <button
            type="button"
            class="primary"
            id="check"
            ${selected.length === 0 || checked ? "disabled" : ""}
          >
            ✓ తనిఖీ చేయండి
          </button>

          <button
            type="button"
            id="next"
            ${!checked ? "disabled" : ""}
          >
            ${number === total ? "ఫలితాలు 🏆" : "తదుపరి →"}
          </button>
        </div>
      </section>

      <section class="card center">
        <div class="mas" aria-hidden="true">🌱</div>

        <h3>మీ స్కోరు</h3>

        <div class="score">${score} / ${answered}</div>

        <p>ప్రతి ప్రయత్నంతో మరింత నేర్చుకోండి!</p>
      </section>
    `;

    attachEvents();
  }

  /* ------------------------------------------
     BUTTON EVENTS
  ------------------------------------------ */

  function attachEvents() {
    app.querySelectorAll("[data-chunk]").forEach(button => {
      button.addEventListener("click", () => {
        if (checked) return;

        const index = Number(button.dataset.chunk);

        if (selected.some(item => item.index === index)) {
          return;
        }

        selected.push({
          index,
          value: current.chunks[index]
        });

        feedbackMessage = "";
        render();
      });
    });

    app.querySelectorAll("[data-remove]").forEach(button => {
      button.addEventListener("click", () => {
        if (checked) return;

        selected.splice(Number(button.dataset.remove), 1);

        feedbackMessage = "";
        render();
      });
    });

    $("#undo").addEventListener("click", () => {
      if (checked || selected.length === 0) return;

      selected.pop();
      feedbackMessage = "";
      render();
    });

    $("#hint").addEventListener("click", giveHint);

    $("#check").addEventListener("click", checkAnswer);

    $("#next").addEventListener("click", nextQuestion);

    $("#exit-game").addEventListener("click", () => {
      const confirmed = confirm(
        "ఆట నుంచి బయటకు వెళ్లాలనుకుంటున్నారా?"
      );

      if (confirmed) {
        level(levelId);
      }
    });
  }

  /* ------------------------------------------
     HINT
  ------------------------------------------ */

  function giveHint() {
    if (checked) return;

    hintUsed = true;

    const prefix = selected.map(item => item.value).join("");

    if (!current.w.startsWith(prefix)) {
      feedbackMessage =
        "మీరు ఎంచుకున్న భాగాలు సరైన క్రమంలో లేవు. వెనక్కి తీసుకుని ప్రయత్నించండి.";

      render();
      return;
    }

    // Find the next chunk that extends the current prefix.
    const nextChunk = current.chunks.find((chunk, index) => {
      const alreadyUsed = selected.some(
        item => item.index === index
      );

      return (
        !alreadyUsed &&
        current.w.startsWith(prefix + chunk)
      );
    });

    if (nextChunk !== undefined) {
      feedbackMessage = `💡 సూచన: "${nextChunk}" భాగాన్ని తదుపరి ఎంచుకోండి.`;
    } else {
      feedbackMessage = "మీ సమాధానాన్ని తనిఖీ చేయండి!";
    }

    render();

    // Highlight the suggested tile.
    if (nextChunk !== undefined) {
      const tile = [...app.querySelectorAll("[data-chunk]")].find(
        button => {
          const index = Number(button.dataset.chunk);
          return current.chunks[index] === nextChunk;
        }
      );

      if (tile) {
        tile.style.background = "#ffe18a";
        tile.style.transform = "translateY(-4px)";
      }
    }
  }

  /* ------------------------------------------
     CHECK ANSWER
  ------------------------------------------ */

  function checkAnswer() {
    if (checked || selected.length === 0) return;

    const answer = selected.map(item => item.value).join("");

    currentCorrect = answer === current.w;
    checked = true;
    answered++;

    const mascot = $("#mascot");

    if (currentCorrect) {
      score++;

      feedbackMessage = "🎉 భలే! మీ సమాధానం సరైనది!";

      if (mascot) {
        mascot.textContent = "🦜";
        mascot.classList.add("hop");
      }

      // Preserve previously correct words in practice mode.
      if (isTest || st[current.w] !== 1) {
        st[current.w] = 1;
        save();
      }

      celebrate();
    } else {
      feedbackMessage = `మంచి ప్రయత్నం! సరైన పదం: ${current.w}`;

      if (mascot) {
        mascot.textContent = "🐣";
        mascot.classList.add("sad");
      }

      if (isTest || st[current.w] !== 1) {
        st[current.w] = 0;
        save();
      }
    }

    render();

    // Restore the mascot animation after the screen rerenders.
    const newMascot = $("#mascot");

    if (newMascot) {
      newMascot.classList.add(currentCorrect ? "hop" : "sad");
    }
  }

  /* ------------------------------------------
     CELEBRATION
  ------------------------------------------ */

  function celebrate() {
    const container = $("#fl");

    if (!container) return;

    if (window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches) {
      return;
    }

    const symbols = ["⭐", "✨", "🌸", "🎉", "🌈"];

    for (let i = 0; i < 16; i++) {
      const particle = document.createElement("span");

      particle.className = "cf";
      particle.textContent = symbols[
        Math.floor(Math.random() * symbols.length)
      ];

      particle.style.left = `${35 + Math.random() * 30}%`;
      particle.style.top = `${35 + Math.random() * 20}%`;
      particle.style.setProperty(
        "--x",
        `${(Math.random() - 0.5) * 450}px`
      );
      particle.style.setProperty(
        "--y",
        `${(Math.random() - 0.5) * 450}px`
      );

      container.appendChild(particle);

      particle.addEventListener("animationend", () => {
        particle.remove();
      });
    }
  }

  /* ------------------------------------------
     NEXT QUESTION
  ------------------------------------------ */

  function nextQuestion() {
    if (!checked) return;

    if (questionIndex < questions.length - 1) {
      questionIndex++;
      showQuestion();
    } else {
      showResults();
    }
  }

  /* ------------------------------------------
     RESULTS
  ------------------------------------------ */

  function showResults() {
    const total = questions.length;

    const percentage = total
      ? Math.round((score / total) * 100)
      : 0;

    let stars = "⭐";

    if (percentage >= 80) {
      stars = "⭐⭐⭐";
    } else if (percentage >= 50) {
      stars = "⭐⭐";
    }

    let message = "మంచి ప్రయత్నం! మరికొంత సాధన చేద్దాం.";

    if (percentage === 100) {
      message = "అద్భుతం! మీరు అన్ని పదాలనూ సరిగ్గా తయారు చేశారు!";
    } else if (percentage >= 80) {
      message = "చాలా బాగా చేశారు! మీ అభ్యాసం అద్భుతంగా ఉంది!";
    } else if (percentage >= 50) {
      message = "చాలా బాగుంది! ఇంకా సాధన చేస్తే మరింత మెరుగవుతారు.";
    }

    app.innerHTML = `
      <header class="center section">
        <div class="mas">🦜</div>

        <h1>ఆట పూర్తయింది!</h1>

        <p>మీ అభ్యాస ఫలితాలు ఇవిగో!</p>
      </header>

      <section class="card center">
        <div class="stars">${stars}</div>

        <h2>${isTest ? "పరీక్ష ఫలితాలు" : "సాధన ఫలితాలు"}</h2>

        <div class="score">${percentage}%</div>

        <p>${message}</p>

        <progress
          value="${score}"
          max="${Math.max(total, 1)}"
          aria-label="మీ తుది స్కోరు"
        ></progress>

        <p>సరైన సమాధానాలు: ${score} / ${total}</p>

        <p>సமాధానాలు ఇచ్చిన ప్రశ్నలు: ${answered}</p>

        <button
          type="button"
          class="big"
          id="retry"
        >
          🔄 మళ్లీ ఆడండి
        </button>

        <div class="actions">
          <button
            type="button"
            class="secondary"
            id="back-level"
          >
            స్థాయికి వెళ్లండి
          </button>

          <button
            type="button"
            class="secondary"
            id="back-home"
          >
            🏡 హోమ్
          </button>
        </div>
      </section>
    `;

    $("#retry").addEventListener("click", () => {
      play(levelId, questionCount, isTest);
    });

    $("#back-level").addEventListener("click", () => {
      level(levelId);
    });

    $("#back-home").addEventListener("click", home);

    if (percentage >= 80) {
      celebrate();
    }
  }
}
