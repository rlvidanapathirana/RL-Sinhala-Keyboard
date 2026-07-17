/* =========================================================================
   RL Sinhala Keyboard V2 — script.js
   Developed by V.P.R. Lakshan Vidanapathirana
   ========================================================================= */
(() => {
  "use strict";

  /* ----------------------------------------------------------------------
   * 1. TRANSLITERATION ENGINE (Singlish -> Sinhala Unicode)
   * -------------------------------------------------------------------- */
  const CONSONANTS = [
    ["nnd", "ඬ"], ["nndh", "ඳ"], ["nng", "ඟ"], ["Th", "ථ"], ["Dh", "ධ"],
    ["gh", "ඝ"], ["Ch", "ඡ"], ["ph", "ඵ"], ["bh", "භ"], ["sh", "ශ"],
    ["Sh", "ෂ"], ["GN", "ඥ"], ["KN", "ඤ"], ["Lu", "ළු"], ["dh", "ද"],
    ["ch", "ච"], ["kh", "ඛ"], ["th", "ත"],
    ["t", "ට"], ["k", "ක"], ["d", "ඩ"], ["n", "න"], ["p", "ප"], ["b", "බ"],
    ["m", "ම"], ["\\\\y", "\u200Dය"], ["Y", "\u200Dය"], ["y", "ය"], ["j", "ජ"],
    ["l", "ල"], ["v", "ව"], ["w", "ව"], ["s", "ස"], ["h", "හ"], ["N", "ණ"],
    ["L", "ළ"], ["K", "ඛ"], ["G", "ඝ"], ["T", "ඨ"], ["D", "ඪ"], ["P", "ඵ"],
    ["B", "ඹ"], ["f", "ෆ"], ["q", "ඣ"], ["g", "ග"],
    ["r", "ර"]
  ];
  const VOWELS = [
    ["oo", "ඌ", "ූ"], ["o\\)", "ඕ", "ෝ"], ["oe", "ඕ", "ෝ"], ["aa", "ආ", "ා"],
    ["a\\)", "ආ", "ා"], ["Aa", "ඈ", "ෑ"], ["A\\)", "ඈ", "ෑ"], ["ae", "ඈ", "ෑ"],
    ["ii", "ඊ", "ී"], ["i\\)", "ඊ", "ී"], ["ie", "ඊ", "ී"], ["ee", "ඊ", "ී"],
    ["ea", "ඒ", "ේ"], ["e\\)", "ඒ", "ේ"], ["ei", "ඒ", "ේ"], ["uu", "ඌ", "ූ"],
    ["u\\)", "ඌ", "ූ"], ["au", "ඖ", "ෞ"], ["/\\\\a", "ඇ", "ැ"],
    ["a", "අ", ""], ["A", "ඇ", "ැ"], ["i", "ඉ", "ි"], ["e", "එ", "ෙ"],
    ["u", "උ", "ු"], ["o", "ඔ", "ො"], ["I", "ඓ", "ෛ"]
  ];
  const SPECIAL_CONSONANTS = [
    [/\\n/g, "ං"], [/\\h/g, "ඃ"], [/\\N/g, "ඞ"], [/\\R/g, "ඍ"],
    [/R/g, "ර්\u200D"], [/\\r/g, "ර්\u200D"]
  ];
  const SPECIAL_CHAR = [["ruu", "ෲ"], ["ru", "ෘ"]];

  function transliterate(input) {
    if (!input) return input;
    let text = input;
    for (const [re, rep] of SPECIAL_CONSONANTS) text = text.replace(re, rep);
    for (const [sc, scu] of SPECIAL_CHAR) {
      for (const [c, cu] of CONSONANTS) text = text.replace(new RegExp(c + sc, "g"), cu + scu);
    }
    for (const [c, cu] of CONSONANTS) {
      for (const [v, , vm] of VOWELS) text = text.replace(new RegExp(c + "r" + v, "g"), cu + "්\u200Dර" + vm);
      text = text.replace(new RegExp(c + "r", "g"), cu + "්\u200Dර");
    }
    for (const [c, cu] of CONSONANTS) {
      for (const [v, , vm] of VOWELS) text = text.replace(new RegExp(c + v, "g"), cu + vm);
    }
    for (const [c, cu] of CONSONANTS) text = text.replace(new RegExp(c, "g"), cu + "්");
    for (const [v, vu] of VOWELS) text = text.replace(new RegExp(v, "g"), vu);
    return text;
  }

  const LATIN_WORD_CHAR = /[A-Za-z\\/)]/;

  /* ----------------------------------------------------------------------
   * 2. SETTINGS (persisted)
   * -------------------------------------------------------------------- */
  const DEFAULT_SETTINGS = { autoCopy: false, sound: false, darkMode: false, realtime: true, fontSize: "medium", voiceLang: "si-LK" };
  let settings = { ...DEFAULT_SETTINGS };

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem("rlsk_settings") || "{}");
      settings = { ...DEFAULT_SETTINGS, ...saved };
    } catch (e) { settings = { ...DEFAULT_SETTINGS }; }
  }
  function saveSettings() {
    localStorage.setItem("rlsk_settings", JSON.stringify(settings));
  }
  function applySettingsToUI() {
    document.getElementById("setAutoCopy").checked = settings.autoCopy;
    document.getElementById("setSound").checked = settings.sound;
    document.getElementById("setDarkMode").checked = settings.darkMode;
    document.getElementById("setRealtime").checked = settings.realtime;
    document.documentElement.setAttribute("data-theme", settings.darkMode ? "dark" : "light");
    document.querySelectorAll("#fontSizeSeg button").forEach(b =>
      b.classList.toggle("active", b.dataset.size === settings.fontSize));
    const sizes = { small: "16px", medium: "19px", large: "23px" };
    document.documentElement.style.setProperty("--editor-font-size", sizes[settings.fontSize] || sizes.medium);
    if (typeof updateMicLangUI === "function") updateMicLangUI();
  }

  /* ----------------------------------------------------------------------
   * 3. SOUND EFFECTS (WebAudio, no external files)
   * -------------------------------------------------------------------- */
  let audioCtx = null;
  function playBeep(freq, duration, volume) {
    if (!settings.sound) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume || 0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration || 0.08));
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + (duration || 0.08));
    } catch (e) { /* audio unsupported, ignore */ }
  }
  const sfx = {
    key: () => playBeep(720, 0.04, 0.035),
    select: () => playBeep(920, 0.09, 0.05),
    copy: () => playBeep(1180, 0.1, 0.05),
    toggle: () => playBeep(500, 0.07, 0.04)
  };

  /* ----------------------------------------------------------------------
   * 4. DATA LOADING (mapping + frequency-ranked word list)
   * -------------------------------------------------------------------- */
  const state = {
    mapping: [], words: [], fuzzy: new Map(),
    uniToFm: new Map(), uniToIsi: new Map(), fmToUni: new Map(), isiToUni: new Map(),
    maxUniLen: 1, maxFmLen: 1, maxIsiLen: 1
  };

  function buildLongestMatchMap(pairs, keyIdx, valIdx) {
    const map = new Map(); let maxLen = 1;
    for (const item of pairs) {
      const k = item[keyIdx], v = item[valIdx];
      if (!k || !v) continue;
      if (!map.has(k)) map.set(k, v);
      if (k.length > maxLen) maxLen = k.length;
    }
    return { map, maxLen };
  }
  function longestMatchConvert(text, map, maxLen) {
    let out = "", i = 0; const n = text.length;
    while (i < n) {
      let matched = false;
      const upper = Math.min(maxLen, n - i);
      for (let l = upper; l >= 1; l--) {
        const sub = text.substr(i, l);
        if (map.has(sub)) { out += map.get(sub); i += l; matched = true; break; }
      }
      if (!matched) { out += text[i]; i += 1; }
    }
    return out;
  }
  async function loadData() {
    try {
      const [mapRes, wordsRes] = await Promise.all([fetch("mapping.json"), fetch("words.json")]);
      state.mapping = await mapRes.json();
      state.words = await wordsRes.json();
    } catch (err) {
      console.warn("Data load failed, features degraded:", err);
      state.mapping = []; state.words = [];
    }
    const rows = state.mapping.map(x => [x.u, x.f, x.i]);
    let r;
    r = buildLongestMatchMap(rows, 0, 1); state.uniToFm = r.map; state.maxUniLen = Math.max(state.maxUniLen, r.maxLen);
    r = buildLongestMatchMap(rows, 0, 2); state.uniToIsi = r.map; state.maxUniLen = Math.max(state.maxUniLen, r.maxLen);
    r = buildLongestMatchMap(rows, 1, 0); state.fmToUni = r.map; state.maxFmLen = r.maxLen;
    r = buildLongestMatchMap(rows, 2, 0); state.isiToUni = r.map; state.maxIsiLen = r.maxLen;

    // Fuzzy Singlish -> Sinhala candidate dictionary loads separately (larger file);
    // typing/suggestions work fine before this resolves, using the live engine only.
    fetch("fuzzy.json").then(r => r.json()).then(obj => {
      state.fuzzy = new Map(Object.entries(obj));
    }).catch(() => { /* dictionary-backed suggestions unavailable, live engine still works */ });
  }
  function toFm(t) { return longestMatchConvert(t, state.uniToFm, state.maxUniLen); }
  function toIsi(t) { return longestMatchConvert(t, state.uniToIsi, state.maxUniLen); }
  function fmToUnicode(t) { return longestMatchConvert(t, state.fmToUni, state.maxFmLen); }
  function isiToUnicode(t) { return longestMatchConvert(t, state.isiToUni, state.maxIsiLen); }

  /* ----------------------------------------------------------------------
   * 5. TOAST
   * -------------------------------------------------------------------- */
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }
  async function copyToClipboard(text, label, silent) {
    if (!text) { if (!silent) showToast("Nothing to copy"); return; }
    try {
      await navigator.clipboard.writeText(text);
      if (!silent) { showToast((label || "Text") + " copied ✓"); sfx.copy(); }
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); if (!silent) showToast((label || "Text") + " copied ✓"); }
      catch (e) { if (!silent) showToast("Copy failed — please select and copy manually"); }
      document.body.removeChild(ta);
    }
  }

  /* ----------------------------------------------------------------------
   * 6. TAB SWITCHING
   * -------------------------------------------------------------------- */
  const tabBtns = document.querySelectorAll(".tab-btn");
  const panels = {
    type: document.getElementById("panel-type"),
    convert: document.getElementById("panel-convert"),
    guide: document.getElementById("panel-guide")
  };
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("active"); btn.setAttribute("aria-selected", "true");
      Object.entries(panels).forEach(([key, el]) => {
        const show = key === btn.dataset.tab;
        el.hidden = !show;
        el.classList.toggle("active", show);
      });
      hideComposePopup();
    });
  });

  /* ----------------------------------------------------------------------
   * 7. MAIN EDITOR — composing state machine + floating popup
   * -------------------------------------------------------------------- */
  const editor = document.getElementById("editor");
  const editorBody = document.querySelector(".editor-body");
  const composePopup = document.getElementById("composePopup");
  const composePreview = document.getElementById("composePreview");
  const composeSuggestions = document.getElementById("composeSuggestions");
  const charCountEl = document.getElementById("charCount");
  const wordCountEl = document.getElementById("wordCount");

  let pending = "";
  let pendingStart = null;
  let previewLen = 0;
  let highlightedIndex = -1;
  let currentMatches = [];

  function currentPreview() { return transliterate(pending); }
  function isCursorAtPendingEnd() {
    return pendingStart !== null && editor.selectionStart === pendingStart + previewLen && editor.selectionEnd === pendingStart + previewLen;
  }
  function resetPending() {
    pending = ""; pendingStart = null; previewLen = 0;
    hideComposePopup();
  }
  function maybeAutoCopy() {
    if (settings.autoCopy) copyToClipboard(editor.value, "Text", true);
  }

  function renderPreview() {
    const preview = currentPreview();
    const before = editor.value.slice(0, pendingStart);
    const after = editor.value.slice(pendingStart + previewLen);
    editor.value = before + preview + after;
    previewLen = preview.length;
    const pos = pendingStart + previewLen;
    editor.setSelectionRange(pos, pos);
    sfx.key();
    showComposePopup(pos, preview, pending);
    updateCounts();
  }

  /* ---- caret pixel position via mirror element ---- */
  const MIRROR_PROPS = ["boxSizing", "width", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontStyle", "fontVariant", "fontWeight", "fontSize",
    "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing", "tabSize", "whiteSpace", "wordBreak"];
  function getCaretCoords(el, position) {
    const div = document.createElement("div");
    const style = getComputedStyle(el);
    div.style.position = "absolute"; div.style.visibility = "hidden"; div.style.whiteSpace = "pre-wrap"; div.style.wordWrap = "break-word";
    MIRROR_PROPS.forEach(p => { div.style[p] = style[p]; });
    div.style.width = style.width;
    document.body.appendChild(div);
    div.textContent = el.value.substring(0, position);
    const span = document.createElement("span");
    span.textContent = el.value.substring(position) || ".";
    div.appendChild(span);
    const coords = { top: span.offsetTop, left: span.offsetLeft };
    document.body.removeChild(div);
    return coords;
  }

  function showComposePopup(cursorPos, previewText, rawWord) {
    composePreview.textContent = previewText || "";
    renderComposeSuggestions(previewText || "", rawWord || "");
    if (!previewText) { hideComposePopup(); return; }

    composePopup.hidden = false;
    const coords = getCaretCoords(editor, cursorPos);
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 24;
    let top = editor.offsetTop + coords.top - editor.scrollTop;
    let left = editor.offsetLeft + coords.left;

    const popupW = composePopup.offsetWidth || 220;
    const popupH = composePopup.offsetHeight || 60;
    const maxLeft = editorBody.clientWidth - popupW - 4;
    left = Math.max(4, Math.min(left, maxLeft));

    const spaceAbove = top;
    if (spaceAbove > popupH + 14) {
      composePopup.classList.remove("flip");
      composePopup.style.top = (top - popupH - 12) + "px";
    } else {
      composePopup.classList.add("flip");
      composePopup.style.top = (top + lineHeight + 6) + "px";
    }
    composePopup.style.left = left + "px";
  }
  function hideComposePopup() {
    composePopup.hidden = true;
    composeSuggestions.innerHTML = "";
    highlightedIndex = -1;
    currentMatches = [];
  }

  function renderComposeSuggestions(previewText, rawWord) {
    composeSuggestions.innerHTML = "";
    highlightedIndex = -1;
    currentMatches = [];
    if (!previewText && !rawWord) return;

    let candidates = [];
    const key = (rawWord || "").toLowerCase();

    // 1. Real dictionary-verified spellings for this exact Singlish word (best quality)
    if (key && state.fuzzy.has(key)) candidates.push(...state.fuzzy.get(key));

    // 2. The live transliteration engine's own conversion (keeps popup consistent with the bubble)
    if (previewText && !candidates.includes(previewText)) candidates.unshift(previewText);

    candidates = [...new Set(candidates)];

    // 3. If we still have few options, fill in with frequency-ranked predictions sharing the same prefix
    if (candidates.length < 4 && previewText && state.words.length) {
      for (let i = 0; i < state.words.length && candidates.length < 8; i++) {
        if (state.words[i].startsWith(previewText) && !candidates.includes(state.words[i])) {
          candidates.push(state.words[i]);
        }
      }
    }
    candidates = candidates.slice(0, 8);

    // 4. Always offer the raw typed text as the last option (Google Input Tools style "keep as-is")
    let rawOptionIndex = -1;
    if (rawWord && !candidates.includes(rawWord)) {
      candidates.push(rawWord);
      rawOptionIndex = candidates.length - 1;
    }

    currentMatches = candidates;
    candidates.forEach((word, idx) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "sugg-chip" + (idx === rawOptionIndex ? " raw-option" : "");
      chip.innerHTML = `<span class="sugg-num">${idx + 1}</span><span class="sugg-word">${word}</span>`;
      chip.addEventListener("mousedown", (e) => { e.preventDefault(); applySuggestion(word); });
      chip.addEventListener("mouseenter", () => setHighlighted(idx));
      composeSuggestions.appendChild(chip);
    });
  }
  function setHighlighted(idx) {
    highlightedIndex = idx;
    [...composeSuggestions.children].forEach((c, i) => c.classList.toggle("highlighted", i === idx));
  }
  function applySuggestion(word) {
    const before = editor.value.slice(0, pendingStart);
    const after = editor.value.slice(pendingStart + previewLen);
    const insert = word + " ";
    editor.value = before + insert + after;
    const pos = before.length + insert.length;
    editor.setSelectionRange(pos, pos);
    sfx.select();
    resetPending();
    editor.focus();
    updateCounts();
    maybeAutoCopy();
  }

  function updateCounts() {
    const val = editor.value;
    charCountEl.textContent = val.length + " characters";
    const words = val.trim().length ? val.trim().split(/\s+/).length : 0;
    wordCountEl.textContent = words + " words";
  }

  editor.addEventListener("beforeinput", (e) => {
    const type = e.inputType;

    /* ---- Non-real-time mode: convert only at word boundaries ---- */
    if (!settings.realtime) {
      if (type === "insertText" && e.data) {
        const isWordChar = [...e.data].every(ch => LATIN_WORD_CHAR.test(ch));
        if (isWordChar) {
          // allow native insertion, update the live-preview popup without touching the field
          requestAnimationFrame(() => {
            const pos = editor.selectionStart;
            let start = pos;
            while (start > 0 && LATIN_WORD_CHAR.test(editor.value[start - 1])) start--;
            const rawWord = editor.value.slice(start, pos);
            if (rawWord) {
              pendingStart = start; previewLen = pos - start; pending = rawWord;
              showComposePopup(pos, transliterate(rawWord), rawWord);
            } else { resetPending(); }
          });
          return;
        } else {
          e.preventDefault();
          const pos = editor.selectionStart;
          let start = pos;
          while (start > 0 && LATIN_WORD_CHAR.test(editor.value[start - 1])) start--;
          const rawWord = editor.value.slice(start, pos);
          const converted = rawWord ? transliterate(rawWord) : "";
          const before = editor.value.slice(0, start), after = editor.value.slice(pos);
          editor.value = before + converted + e.data + after;
          const newPos = before.length + converted.length + e.data.length;
          editor.setSelectionRange(newPos, newPos);
          resetPending();
          updateCounts();
          maybeAutoCopy();
          return;
        }
      }
      resetPending();
      return;
    }

    /* ---- Real-time mode (default): live per-keystroke composing ---- */
    if (type === "insertText" && e.data) {
      if (pending && !isCursorAtPendingEnd()) resetPending();
      const isWordChar = [...e.data].every(ch => LATIN_WORD_CHAR.test(ch));
      if (isWordChar) {
        e.preventDefault();
        if (pendingStart === null) {
          const selStart = editor.selectionStart, selEnd = editor.selectionEnd;
          if (selEnd > selStart) editor.value = editor.value.slice(0, selStart) + editor.value.slice(selEnd);
          pendingStart = selStart;
        }
        pending += e.data;
        renderPreview();
      } else {
        resetPending();
      }
      return;
    }

    if (type === "deleteContentBackward") {
      if (pending && isCursorAtPendingEnd()) {
        e.preventDefault();
        pending = pending.slice(0, -1);
        if (!pending) {
          const before = editor.value.slice(0, pendingStart), after = editor.value.slice(pendingStart + previewLen);
          editor.value = before + after;
          editor.setSelectionRange(pendingStart, pendingStart);
          resetPending(); updateCounts();
        } else { renderPreview(); }
      } else { resetPending(); }
      return;
    }
    resetPending();
  });

  editor.addEventListener("keydown", (e) => {
    if (composePopup.hidden || !currentMatches.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((highlightedIndex + 1) % currentMatches.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((highlightedIndex - 1 + currentMatches.length) % currentMatches.length); }
    else if (e.key === "Enter" && highlightedIndex >= 0) { e.preventDefault(); applySuggestion(currentMatches[highlightedIndex]); }
    else if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx < currentMatches.length) { e.preventDefault(); applySuggestion(currentMatches[idx]); }
    }
    else if (e.key === "Escape") { hideComposePopup(); }
  });

  editor.addEventListener("keyup", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
      if (pending && !isCursorAtPendingEnd()) resetPending();
    }
  });
  editor.addEventListener("click", () => { if (pending && !isCursorAtPendingEnd()) resetPending(); });
  editor.addEventListener("blur", (e) => {
    // don't dismiss if focus moved into the popup itself
    setTimeout(() => { if (!composePopup.contains(document.activeElement)) resetPending(); }, 120);
  });
  editor.addEventListener("input", () => { updateCounts(); maybeAutoCopy(); });
  window.addEventListener("resize", () => { if (!composePopup.hidden) hideComposePopup(); });

  updateCounts();

  /* ----------------------------------------------------------------------
   * 8. VOICE TYPING (Web Speech API, Sinhala + English)
   * -------------------------------------------------------------------- */
  const micBtn = document.getElementById("micBtn");
  const micStatus = document.getElementById("micStatus");
  const micStatusText = document.getElementById("micStatusText");
  const micUnsupported = document.getElementById("micUnsupported");
  const micLangToggle = document.getElementById("micLangToggle");
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;
  let pendingLangRestart = false;

  const LANG_LABELS = { "si-LK": "Listening in Sinhala… speak now", "en-US": "Listening in English… speak now" };
  const SENTENCE_END = /[.!?…]\s*$/;

  function setMicIdleUI() {
    isRecording = false;
    micBtn.classList.remove("recording");
    micStatus.hidden = true;
  }

  function updateMicLangUI() {
    [...micLangToggle.children].forEach(b => b.classList.toggle("active", b.dataset.lang === settings.voiceLang));
    if (recognition && !isRecording) recognition.lang = settings.voiceLang;
  }

  micLangToggle.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-lang]");
    if (!btn) return;
    settings.voiceLang = btn.dataset.lang;
    saveSettings();
    sfx.toggle();
    if (isRecording) {
      // Never touch editor.value here — only the recognizer is restarted with the new
      // language. The restart itself happens from onend, once the old session has
      // fully closed, to avoid a race where a premature start() silently fails.
      pendingLangRestart = true;
      recognition.stop();
    } else {
      updateMicLangUI();
    }
  });

  if (SpeechRecognitionCtor) {
    recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = settings.voiceLang || "si-LK";

    recognition.onstart = () => {
      isRecording = true;
      micBtn.classList.add("recording");
      micStatus.hidden = false;
      micStatusText.textContent = LANG_LABELS[settings.voiceLang] || LANG_LABELS["si-LK"];
      updateMicLangUI();
    };
    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") { setMicIdleUI(); return; }
      micStatusText.textContent = "Something went wrong — try again (" + e.error + ")";
      setTimeout(setMicIdleUI, 1800);
    };
    recognition.onend = () => {
      setMicIdleUI();
      if (pendingLangRestart) {
        pendingLangRestart = false;
        recognition.lang = settings.voiceLang;
        updateMicLangUI();
        try { recognition.start(); } catch (err) { /* device released mic, user can tap again */ }
      }
    };
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText) {
        // Text is inserted exactly as recognized (Sinhala script or English Latin script,
        // depending on the active voice language) — never run through transliteration.
        // Each recognized segment (i.e. the phrase said before a natural pause) gets a
        // trailing full stop automatically, unless it already ends with punctuation.
        if (pending) resetPending();
        const trimmed = finalText.trim();
        const withStop = SENTENCE_END.test(trimmed) ? trimmed : trimmed + ".";
        const pos = editor.selectionStart;
        const before = editor.value.slice(0, pos), after = editor.value.slice(pos);
        const insert = withStop + " ";
        editor.value = before + insert + after;
        const newPos = before.length + insert.length;
        editor.setSelectionRange(newPos, newPos);
        updateCounts();
        maybeAutoCopy();
      }
    };

    micBtn.addEventListener("click", () => {
      sfx.toggle();
      if (isRecording) { pendingLangRestart = false; recognition.stop(); }
      else {
        if (pending) resetPending();
        editor.focus();
        recognition.lang = settings.voiceLang || "si-LK";
        try { recognition.start(); } catch (err) { setMicIdleUI(); }
      }
    });
    updateMicLangUI();
  } else {
    micBtn.disabled = true;
    micBtn.style.opacity = "0.5";
    micLangToggle.style.opacity = "0.5";
    micLangToggle.style.pointerEvents = "none";
    micUnsupported.hidden = false;
  }

  /* ----------------------------------------------------------------------
   * 9. VIRTUAL KEYBOARD
   * -------------------------------------------------------------------- */
  const kbToggleBtn = document.getElementById("kbToggleBtn");
  const virtualKeyboard = document.getElementById("virtualKeyboard");
  const VK_VOWELS = ["අ", "ආ", "ඇ", "ඈ", "ඉ", "ඊ", "උ", "ඌ", "එ", "ඒ", "ඓ", "ඔ", "ඕ", "ඖ"];
  const VK_CONSONANTS = ["ක", "ඛ", "ග", "ඝ", "ඞ", "ච", "ඡ", "ජ", "ඣ", "ඤ", "ට", "ඨ", "ඩ", "ඪ", "ණ",
    "ත", "ථ", "ද", "ධ", "න", "ප", "ඵ", "බ", "භ", "ම", "ය", "ර", "ල", "ව", "ශ", "ෂ", "ස", "හ", "ළ", "ෆ"];
  const VK_MODIFIERS = ["ං", "ඃ", "්", "ා", "ැ", "ෑ", "ි", "ී", "ු", "ූ", "ෙ", "ේ", "ෛ", "ො", "ෝ", "ෞ"];

  function buildVirtualKeyboard() {
    virtualKeyboard.innerHTML = "";
    const addRow = (chars) => chars.forEach(ch => {
      const key = document.createElement("button");
      key.type = "button"; key.className = "vk-key"; key.textContent = ch;
      key.addEventListener("mousedown", (e) => { e.preventDefault(); sfx.key(); insertAtCursor(ch); });
      virtualKeyboard.appendChild(key);
    });
    addRow(VK_VOWELS); addRow(VK_CONSONANTS); addRow(VK_MODIFIERS);
    const spaceKey = document.createElement("button");
    spaceKey.type = "button"; spaceKey.className = "vk-key space"; spaceKey.textContent = "SPACE";
    spaceKey.addEventListener("mousedown", (e) => { e.preventDefault(); insertAtCursor(" "); });
    virtualKeyboard.appendChild(spaceKey);
  }
  function insertAtCursor(str) {
    if (pending) resetPending();
    editor.focus();
    const pos = editor.selectionStart;
    editor.value = editor.value.slice(0, pos) + str + editor.value.slice(pos);
    const newPos = pos + str.length;
    editor.setSelectionRange(newPos, newPos);
    updateCounts();
    maybeAutoCopy();
  }
  kbToggleBtn.addEventListener("click", () => {
    virtualKeyboard.hidden = !virtualKeyboard.hidden;
    kbToggleBtn.classList.toggle("tool-active", !virtualKeyboard.hidden);
    if (!virtualKeyboard.hidden && !virtualKeyboard.childElementCount) buildVirtualKeyboard();
  });

  /* ----------------------------------------------------------------------
   * 10. CLEAR / COPY / DOWNLOAD
   * -------------------------------------------------------------------- */
  document.getElementById("clearBtn").addEventListener("click", () => {
    editor.value = ""; resetPending(); updateCounts(); editor.focus();
  });
  document.getElementById("copyUnicodeBtn").addEventListener("click", () => copyToClipboard(editor.value, "Unicode"));
  document.getElementById("copyFmBtn").addEventListener("click", () => copyToClipboard(toFm(editor.value), "FM Abhaya"));
  document.getElementById("copyIsiBtn").addEventListener("click", () => copyToClipboard(toIsi(editor.value), "ISI"));

  const outputFontMode = document.getElementById("outputFontMode");
  document.getElementById("downloadBtn").addEventListener("click", () => {
    let text = editor.value, label = "unicode";
    if (outputFontMode.value === "fm") { text = toFm(editor.value); label = "fm-abhaya"; }
    else if (outputFontMode.value === "isi") { text = toIsi(editor.value); label = "isi"; }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rl-sinhala-" + label + ".txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded ✓");
  });

  /* ----------------------------------------------------------------------
   * 11. FONT CONVERTER TAB
   * -------------------------------------------------------------------- */
  const convertDirection = document.getElementById("convertDirection");
  const convertInput = document.getElementById("convertInput");
  const convertOutput = document.getElementById("convertOutput");
  const convertInputLabel = document.getElementById("convertInputLabel");
  const convertOutputLabel = document.getElementById("convertOutputLabel");
  const DIRECTION_LABELS = {
    uni2fm: ["Input (Unicode)", "Output (FM Abhaya)"], uni2isi: ["Input (Unicode)", "Output (ISI)"],
    fm2uni: ["Input (FM Abhaya)", "Output (Unicode)"], isi2uni: ["Input (ISI)", "Output (Unicode)"]
  };
  function updateConvertLabels() {
    const [inLabel, outLabel] = DIRECTION_LABELS[convertDirection.value];
    convertInputLabel.textContent = inLabel; convertOutputLabel.textContent = outLabel;
    convertOutput.classList.toggle("legacy-preview", convertDirection.value.startsWith("uni2"));
  }
  convertDirection.addEventListener("change", updateConvertLabels);
  updateConvertLabels();
  function runConvert() {
    const val = convertInput.value; let out = "";
    switch (convertDirection.value) {
      case "uni2fm": out = toFm(val); break;
      case "uni2isi": out = toIsi(val); break;
      case "fm2uni": out = fmToUnicode(val); break;
      case "isi2uni": out = isiToUnicode(val); break;
    }
    convertOutput.value = out;
  }
  document.getElementById("convertBtn").addEventListener("click", runConvert);
  convertInput.addEventListener("input", runConvert);
  document.getElementById("swapDirectionBtn").addEventListener("click", () => {
    const map = { uni2fm: "fm2uni", fm2uni: "uni2fm", uni2isi: "isi2uni", isi2uni: "uni2isi" };
    convertDirection.value = map[convertDirection.value];
    const tmp = convertInput.value; convertInput.value = convertOutput.value; convertOutput.value = tmp;
    updateConvertLabels(); runConvert();
  });
  document.getElementById("copyOutputBtn").addEventListener("click", () => copyToClipboard(convertOutput.value, "Output"));
  document.getElementById("pasteInputBtn").addEventListener("click", async () => {
    try { const text = await navigator.clipboard.readText(); convertInput.value = text; runConvert(); }
    catch (err) { showToast("Clipboard permission denied — paste manually (Ctrl/Cmd+V)"); }
  });
  const fontFileInput = document.getElementById("fontFileInput");
  fontFileInput.addEventListener("change", () => {
    const file = fontFileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const fontFace = new FontFace("RLLegacyPreviewFont", `url(${url})`);
    fontFace.load().then(loaded => {
      document.fonts.add(loaded);
      convertOutput.style.fontFamily = "'RLLegacyPreviewFont', sans-serif";
      showToast("Font loaded — preview updated ✓");
    }).catch(() => showToast("Couldn't load that font file"));
  });

  /* ----------------------------------------------------------------------
   * 12. GUIDE TAB
   * -------------------------------------------------------------------- */
  const SCHEME_ITEMS = [
    ["a", "අ"], ["aa", "ආ"], ["A / ae", "ඇ"], ["Aa", "ඈ"], ["i", "ඉ"], ["ii / ee", "ඊ"],
    ["u", "උ"], ["uu / oo", "ඌ"], ["e", "එ"], ["ea", "ඒ"], ["I", "ඓ"], ["o", "ඔ"],
    ["oe", "ඕ"], ["au", "ඖ"],
    ["k", "ක"], ["kh / K", "ඛ"], ["g", "ග"], ["gh / G", "ඝ"], ["ch", "ච"], ["Ch", "ඡ"],
    ["j", "ජ"], ["q", "ඣ"], ["KN", "ඤ"], ["t", "ට"], ["T", "ඨ"], ["d", "ඩ"], ["D", "ඪ"],
    ["N", "ණ"], ["th", "ත"], ["Th", "ථ"], ["dh", "ද"], ["Dh", "ධ"], ["n", "න"],
    ["p", "ප"], ["ph / P", "ඵ"], ["b", "බ"], ["B", "ඹ"], ["bh", "භ"], ["m", "ම"],
    ["y", "ය"], ["r", "ර"], ["l", "ල"], ["v / w", "ව"], ["sh", "ශ"], ["Sh", "ෂ"],
    ["s", "ස"], ["h", "හ"], ["L", "ළ"], ["f", "ෆ"]
  ];
  const SPECIAL_ITEMS = [
    ["\\n", "ං (Anusvara)"], ["\\h", "ඃ (Visarga)"], ["\\N", "ඞ"], ["\\R", "ඍ"],
    ["R / \\r", "ර්‍ (Repaya)"], ["Y", "‍ය (Yansaya)"],
    ["Xr + vowel", "X්‍ර… (Rakaransha) — e.g. kra → ක්‍ර"],
    ["Xru", "Xෘ — e.g. kru → කෘ"], ["Xruu", "Xෲ — e.g. kruu → කෲ"]
  ];
  const EXAMPLE_ITEMS = [
    ["mama gedara yanawa", "මම ගෙදර යනවා"],
    ["oyage nama mokakdha", "ඔයගෙ නම මොකක්ද"],
    ["subha aluth avurudhak", "සුභ අලුත් අවුරුද්දක්"],
    ["sri lanka", "ශ්‍රී ලංකා"],
    ["kohomadha", "කොහොමද"]
  ];
  function buildGuideTables() {
    document.getElementById("schemeGrid").innerHTML = SCHEME_ITEMS.map(([k, v]) =>
      `<div class="scheme-item"><code>${k}</code><span class="glyph">${v}</span></div>`).join("");
    document.getElementById("specialGrid").innerHTML = SPECIAL_ITEMS.map(([k, v]) =>
      `<div class="scheme-item"><code>${k}</code><span class="glyph" style="font-size:14px">${v}</span></div>`).join("");
    document.getElementById("exampleGrid").innerHTML = EXAMPLE_ITEMS.map(([inp, out]) =>
      `<div class="example-row"><span class="in">${inp}</span><span class="out">${out}</span></div>`).join("");
  }
  buildGuideTables();

  /* ----------------------------------------------------------------------
   * 13. SETTINGS DRAWER
   * -------------------------------------------------------------------- */
  const settingsBtn = document.getElementById("settingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const settingsDrawer = document.getElementById("settingsDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");

  function openDrawer() {
    settingsDrawer.classList.add("open");
    settingsDrawer.setAttribute("aria-hidden", "false");
    drawerOverlay.hidden = false;
  }
  function closeDrawer() {
    settingsDrawer.classList.remove("open");
    settingsDrawer.setAttribute("aria-hidden", "true");
    drawerOverlay.hidden = true;
  }
  settingsBtn.addEventListener("click", openDrawer);
  closeSettingsBtn.addEventListener("click", closeDrawer);
  drawerOverlay.addEventListener("click", closeDrawer);

  document.getElementById("setAutoCopy").addEventListener("change", (e) => { settings.autoCopy = e.target.checked; saveSettings(); sfx.toggle(); });
  document.getElementById("setSound").addEventListener("change", (e) => { settings.sound = e.target.checked; saveSettings(); if (settings.sound) sfx.toggle(); });
  document.getElementById("setDarkMode").addEventListener("change", (e) => { settings.darkMode = e.target.checked; saveSettings(); applySettingsToUI(); sfx.toggle(); });
  document.getElementById("setRealtime").addEventListener("change", (e) => { settings.realtime = e.target.checked; saveSettings(); resetPending(); sfx.toggle(); });
  document.getElementById("fontSizeSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-size]");
    if (!btn) return;
    settings.fontSize = btn.dataset.size; saveSettings(); applySettingsToUI(); sfx.toggle();
  });
  document.getElementById("resetSettingsBtn").addEventListener("click", () => {
    settings = { ...DEFAULT_SETTINGS }; saveSettings(); applySettingsToUI();
    showToast("Settings reset to defaults");
  });

  /* ----------------------------------------------------------------------
   * 14. FOOTER YEAR
   * -------------------------------------------------------------------- */
  document.getElementById("footerYear").textContent = new Date().getFullYear();

  /* ----------------------------------------------------------------------
   * 15. PWA — install prompt + service worker
   * -------------------------------------------------------------------- */
  const installBtn = document.getElementById("installBtn");
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener("appinstalled", () => { installBtn.hidden = true; showToast("App installed ✓"); });

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS && !isStandalone) {
    installBtn.hidden = false;
    installBtn.addEventListener("click", () => {
      showToast("On iPhone: tap Share, then \"Add to Home Screen\"");
    }, { once: false });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => { /* offline support unavailable */ });
    });
  }

  /* ----------------------------------------------------------------------
   * 16. INIT
   * -------------------------------------------------------------------- */
  loadSettings();
  applySettingsToUI();
  loadData();
})();
