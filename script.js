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
    // Longer / more specific patterns must stay ahead of any shorter prefix they contain.
    // Note: multi-letter tokens here are the BARE consonant (no vowel baked in) so they
    // combine correctly with vowel suffixes via the same mechanism as every other entry —
    // e.g. "chh" + "a" -> ඡ, not a fixed literal "chha" string (which would let a shorter
    // rule like "h"+"a" wrongly match inside it before the longer form ever got a chance).
    ["nnd", "ඬ"], ["nndh", "ඳ"], ["nng", "ඟ"],
    ["zdh", "ඳ"], ["zq", "ඳ"], ["zd", "ඬ"], ["zg", "ඟ"], ["zj", "ඦ"], ["zk", "ඤ"], ["zh", "ඥ"],
    ["chh", "ඡ"], ["thh", "ථ"], ["dhh", "ධ"],
    ["Th", "ථ"], ["Dh", "ධ"],
    ["gh", "ඝ"], ["Ch", "ඡ"], ["ph", "ඵ"], ["bh", "භ"], ["sh", "ශ"],
    ["Sh", "ෂ"], ["GN", "ඥ"], ["KN", "ඤ"], ["Lu", "ළු"], ["dh", "ද"],
    ["ch", "ච"], ["kh", "ඛ"], ["th", "ත"],
    ["t", "ට"], ["k", "ක"], ["d", "ඩ"], ["n", "න"], ["p", "ප"], ["b", "බ"],
    ["m", "ම"], ["\\\\y", "\u200Dය"], ["Y", "\u200Dය"], ["y", "ය"], ["j", "ජ"],
    ["l", "ල"], ["v", "ව"], ["w", "ව"], ["s", "ස"], ["h", "හ"], ["N", "ණ"],
    ["L", "ළ"], ["K", "ඛ"], ["G", "ඝ"], ["T", "ඨ"], ["D", "ඪ"], ["P", "ඵ"],
    ["B", "ඹ"], ["f", "ෆ"], ["q", "ද"], ["g", "ග"], ["S", "ෂ"], ["X", "ඞ"],
    ["r", "ර"]
  ];
  const VOWELS = [
    // Multi-letter vowels must be listed ahead of any single-letter vowel they start with.
    ["oo", "ඕ", "ෝ"], ["o\\)", "ඕ", "ෝ"], ["oe", "ඕ", "ෝ"], ["aa", "ආ", "ා"],
    ["a\\)", "ආ", "ා"], ["AA", "ඈ", "ෑ"], ["Aa", "ඈ", "ෑ"], ["A\\)", "ඈ", "ෑ"], ["ae", "ඈ", "ෑ"],
    ["ii", "ඊ", "ී"], ["i\\)", "ඊ", "ී"], ["ie", "ඊ", "ී"], ["ee", "ඒ", "ේ"],
    ["ea", "ඒ", "ේ"], ["e\\)", "ඒ", "ේ"], ["ei", "ඒ", "ේ"], ["uu", "ඌ", "ූ"],
    ["u\\)", "ඌ", "ූ"], ["au", "ඖ", "ෞ"], ["ou", "ඖ", "ෞ"], ["ai", "ඓ", "ෛ"], ["Ru", "ඎ", "ෲ"],
    ["/\\\\a", "ඇ", "ැ"],
    ["a", "අ", ""], ["A", "ඇ", "ැ"], ["i", "ඉ", "ි"], ["e", "එ", "ෙ"],
    ["u", "උ", "ු"], ["o", "ඔ", "ො"], ["I", "ඓ", "ෛ"], ["R", "ඍ", "ෘ"]
  ];
  const SPECIAL_CONSONANTS = [
    [/\\n/g, "ං"], [/\\h/g, "ඃ"], [/\\N/g, "ඞ"], [/\\R/g, "ඍ"],
    [/\\r/g, "ර්\u200D"], [/zn/g, "ං"], [/H/g, "ඃ"]
  ];
  const SPECIAL_CHAR = [["ruu", "ෲ"], ["ru", "ෘ"]];


  // All regexes are compiled once here instead of on every keystroke — this is what
  // keeps live typing fast even as the transliteration rule set has grown.
  function buildRules() {
    const rules = {
      specialChar: [], rakaransha: [], rakaranshaBare: [],
      yansaya: [], yansayaBare: [], consonantVowel: [], consonantBare: [], vowel: []
    };
    for (const [sc, scu] of SPECIAL_CHAR) {
      for (const [c, cu] of CONSONANTS) rules.specialChar.push([new RegExp(c + sc, "g"), cu + scu]);
    }
    // Rakaransha: consonant + r + vowel -> conjunct r (e.g. kra -> ක්‍ර)
    for (const [c, cu] of CONSONANTS) {
      for (const [v, , vm] of VOWELS) rules.rakaransha.push([new RegExp(c + "r" + v, "g"), cu + "්\u200Dර" + vm]);
      rules.rakaranshaBare.push([new RegExp(c + "r", "g"), cu + "්\u200Dර"]);
    }
    // Yansaya: consonant + y + vowel -> conjunct y (e.g. vidya -> වි ද් + ZWJ + ය + ා = විද්‍යා)
    // This runs automatically for plain "y" now, so you don't need the old \y / Y escape
    // just to get a properly-joined conjunct in the middle of a word.
    for (const [c, cu] of CONSONANTS) {
      for (const [v, , vm] of VOWELS) rules.yansaya.push([new RegExp(c + "y" + v, "g"), cu + "්\u200Dය" + vm]);
      rules.yansayaBare.push([new RegExp(c + "y", "g"), cu + "්\u200Dය"]);
    }
    for (const [c, cu] of CONSONANTS) {
      for (const [v, , vm] of VOWELS) rules.consonantVowel.push([new RegExp(c + v, "g"), cu + vm]);
    }
    for (const [c, cu] of CONSONANTS) rules.consonantBare.push([new RegExp(c, "g"), cu + "්"]);
    for (const [v, vu] of VOWELS) rules.vowel.push([new RegExp(v, "g"), vu]);
    return rules;
  }
  const RULES = buildRules();

  function transliterate(input) {
    if (!input) return input;
    let text = input;
    for (const [re, rep] of SPECIAL_CONSONANTS) text = text.replace(re, rep);
    for (const [re, rep] of RULES.specialChar) text = text.replace(re, rep);
    for (const [re, rep] of RULES.rakaransha) text = text.replace(re, rep);
    for (const [re, rep] of RULES.rakaranshaBare) text = text.replace(re, rep);
    for (const [re, rep] of RULES.yansaya) text = text.replace(re, rep);
    for (const [re, rep] of RULES.yansayaBare) text = text.replace(re, rep);
    for (const [re, rep] of RULES.consonantVowel) text = text.replace(re, rep);
    for (const [re, rep] of RULES.consonantBare) text = text.replace(re, rep);
    for (const [re, rep] of RULES.vowel) text = text.replace(re, rep);
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
    mapping: [], words: [], fuzzy: new Map(), fuzzyKeysSorted: [],
    uniToFm: new Map(), uniToIsi: new Map(), fmToUni: new Map(), isiToUni: new Map(),
    maxUniLen: 1, maxFmLen: 1, maxIsiLen: 1
  };

  // Binary-search a sorted string array for all entries starting with `prefix`,
  // capped at `limit`. Used to power "complete the word" style predictions
  // (e.g. typing "patam" finds the dictionary entry for "patamalava").
  function prefixSearchSorted(sortedArr, prefix, limit) {
    let lo = 0, hi = sortedArr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedArr[mid] < prefix) lo = mid + 1; else hi = mid;
    }
    const out = [];
    for (let i = lo; i < sortedArr.length && out.length < limit; i++) {
      if (!sortedArr[i].startsWith(prefix)) break;
      out.push(sortedArr[i]);
    }
    return out;
  }

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
      state.fuzzyKeysSorted = [...state.fuzzy.keys()].sort();
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
    dictionary: document.getElementById("panel-dictionary"),
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
      if (btn.dataset.tab === "dictionary") ensureMeaningsLoaded();
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

  /* ---- caret pixel position via mirror element (cached & reused for smooth typing) ---- */
  const MIRROR_PROPS = ["boxSizing", "width", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontStyle", "fontVariant", "fontWeight", "fontSize",
    "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing", "tabSize", "whiteSpace", "wordBreak"];
  let mirrorDiv = null, mirrorSpan = null, mirrorSyncedKey = "";
  function getCaretCoords(el, position) {
    if (!mirrorDiv) {
      mirrorDiv = document.createElement("div");
      mirrorDiv.style.position = "absolute";
      mirrorDiv.style.visibility = "hidden";
      mirrorDiv.style.whiteSpace = "pre-wrap";
      mirrorDiv.style.wordWrap = "break-word";
      mirrorDiv.style.top = "0"; mirrorDiv.style.left = "-9999px";
      mirrorSpan = document.createElement("span");
      mirrorDiv.appendChild(mirrorSpan);
      document.body.appendChild(mirrorDiv);
    }
    const style = getComputedStyle(el);
    // Re-sync the full style set only when box size or font actually changed (e.g. on
    // resize or the Font Size setting) — not on every keystroke.
    const syncKey = style.width + "|" + style.fontSize + "|" + style.fontFamily + "|" + style.lineHeight;
    if (syncKey !== mirrorSyncedKey) {
      MIRROR_PROPS.forEach(p => { mirrorDiv.style[p] = style[p]; });
      mirrorSyncedKey = syncKey;
    }
    mirrorDiv.textContent = el.value.substring(0, position);
    mirrorSpan.textContent = el.value.substring(position) || ".";
    mirrorDiv.appendChild(mirrorSpan);
    return { top: mirrorSpan.offsetTop, left: mirrorSpan.offsetLeft };
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

    // 1. Real dictionary-verified spelling(s) for exactly what's typed so far (best quality —
    //    this is what fixes cases like "gedara" wrongly guessing ගෙඩර instead of ගෙදර).
    if (key && state.fuzzy.has(key)) candidates.push(...state.fuzzy.get(key));

    // 2. The live transliteration engine's own conversion (keeps popup consistent with the bubble)
    if (previewText && !candidates.includes(previewText)) candidates.push(previewText);

    // 3. Prefix completion: find longer real dictionary words that START with what you've
    //    typed so far, e.g. typing "patam" finds "patamalava" -> පාඨමාලාව. This is what lets
    //    a short prefix predict a full, common word instead of just literally converting
    //    the letters typed up to that point.
    if (key && key.length >= 3 && state.fuzzyKeysSorted.length) {
      const prefixKeys = prefixSearchSorted(state.fuzzyKeysSorted, key, 12);
      for (const pk of prefixKeys) {
        if (pk === key) continue;
        const vals = state.fuzzy.get(pk);
        if (vals && vals[0] && !candidates.includes(vals[0])) candidates.push(vals[0]);
        if (candidates.length >= 8) break;
      }
    }

    candidates = [...new Set(candidates)];

    // 4. If we still have few options, fill in with frequency-ranked predictions sharing the same prefix
    if (candidates.length < 4 && previewText && state.words.length) {
      for (let i = 0; i < state.words.length && candidates.length < 8; i++) {
        if (state.words[i].startsWith(previewText) && !candidates.includes(state.words[i])) {
          candidates.push(state.words[i]);
        }
      }
    }
    candidates = candidates.slice(0, 8);

    // 5. Always offer the raw typed text as the last option (Google Input Tools style "keep as-is")
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

    /* ---- English mode: the සිං/EN toggle now also controls keyboard typing,
       not just voice — when EN is active, typed letters are left exactly as typed. ---- */
    if (settings.voiceLang === "en-US") {
      if (pending) resetPending();
      return; // let the browser insert the character normally, no transliteration
    }

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
    if (pending) resetPending(); // only stops tracking the in-progress word; text already on screen is untouched
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
  // Conjunct helpers: click a base consonant first, then one of these to join it into a
  // yansaya/rakaransha/repaya conjunct — useful when the Singlish shortcut is hard to recall.
  const VK_CONJUNCTS = [
    { label: "◌්‍ය", title: "Yansaya — join as ්‍ය (e.g. ක් + this → ක්‍ය)", insert: "්\u200Dය" },
    { label: "◌්‍ර", title: "Rakaransha — join as ්‍ර (e.g. ක් + this → ක්‍ර)", insert: "්\u200Dර" },
    { label: "ර්‍◌", title: "Repaya — insert before the next consonant", insert: "ර්\u200D" },
    { label: "ZWJ", title: "Zero-width joiner — for building other conjuncts manually", insert: "\u200D" }
  ];

  function buildVirtualKeyboard() {
    virtualKeyboard.innerHTML = "";
    const addRow = (chars) => chars.forEach(ch => {
      const key = document.createElement("button");
      key.type = "button"; key.className = "vk-key"; key.textContent = ch;
      key.addEventListener("mousedown", (e) => { e.preventDefault(); sfx.key(); insertAtCursor(ch); });
      virtualKeyboard.appendChild(key);
    });
    addRow(VK_VOWELS); addRow(VK_CONSONANTS); addRow(VK_MODIFIERS);
    VK_CONJUNCTS.forEach(({ label, title, insert }) => {
      const key = document.createElement("button");
      key.type = "button"; key.className = "vk-key vk-conjunct"; key.textContent = label; key.title = title;
      key.addEventListener("mousedown", (e) => { e.preventDefault(); sfx.key(); insertAtCursor(insert); });
      virtualKeyboard.appendChild(key);
    });
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
    uni2fm: ["Input (type Singlish or paste Unicode)", "Output (FM Abhaya)"],
    uni2isi: ["Input (type Singlish or paste Unicode)", "Output (ISI)"],
    fm2uni: ["Input (FM Abhaya)", "Output (Unicode)"], isi2uni: ["Input (ISI)", "Output (Unicode)"]
  };
  function updateConvertLabels() {
    const [inLabel, outLabel] = DIRECTION_LABELS[convertDirection.value];
    convertInputLabel.textContent = inLabel; convertOutputLabel.textContent = outLabel;
    convertOutput.classList.toggle("legacy-preview", convertDirection.value.startsWith("uni2"));
    convertInput.placeholder = convertDirection.value.startsWith("uni2")
      ? "Type in Singlish (e.g. mama gedara yanawa) or paste Unicode text…"
      : "Paste or type legacy text here…";
  }
  convertDirection.addEventListener("change", updateConvertLabels);
  updateConvertLabels();

  // Reusable lightweight version of the live word-composing engine (no popup/suggestions —
  // just conversion), so the converter's own input box can also be typed in Singlish.
  function attachLiveTransliteration(textarea, isEnabled, onChange) {
    let pend = "", pendStart = null, prevLen = 0;
    const atEnd = () => pendStart !== null && textarea.selectionStart === pendStart + prevLen && textarea.selectionEnd === pendStart + prevLen;
    const reset = () => { pend = ""; pendStart = null; prevLen = 0; };
    const render = () => {
      const preview = transliterate(pend);
      const before = textarea.value.slice(0, pendStart), after = textarea.value.slice(pendStart + prevLen);
      textarea.value = before + preview + after;
      prevLen = preview.length;
      const pos = pendStart + prevLen;
      textarea.setSelectionRange(pos, pos);
      onChange();
    };
    textarea.addEventListener("beforeinput", (e) => {
      if (!isEnabled()) { reset(); return; }
      const type = e.inputType;
      if (type === "insertText" && e.data) {
        if (pend && !atEnd()) reset();
        const isWordChar = [...e.data].every(ch => LATIN_WORD_CHAR.test(ch));
        if (isWordChar) {
          e.preventDefault();
          if (pendStart === null) {
            const s = textarea.selectionStart, en = textarea.selectionEnd;
            if (en > s) textarea.value = textarea.value.slice(0, s) + textarea.value.slice(en);
            pendStart = s;
          }
          pend += e.data;
          render();
        } else { reset(); }
        return;
      }
      if (type === "deleteContentBackward") {
        if (pend && atEnd()) {
          e.preventDefault();
          pend = pend.slice(0, -1);
          if (!pend) {
            const before = textarea.value.slice(0, pendStart), after = textarea.value.slice(pendStart + prevLen);
            textarea.value = before + after;
            textarea.setSelectionRange(pendStart, pendStart);
            reset(); onChange();
          } else { render(); }
        } else { reset(); }
        return;
      }
      reset();
    });
    textarea.addEventListener("blur", () => { if (pend) reset(); });
    textarea.addEventListener("click", () => { if (pend && !atEnd()) reset(); });
  }
  attachLiveTransliteration(convertInput, () => convertDirection.value.startsWith("uni2"), () => runConvert());

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
   * 12. DICTIONARY — English <-> Sinhala lookup (double-click in editor, or search tab)
   * -------------------------------------------------------------------- */
  const dictSearchInput = document.getElementById("dictSearchInput");
  const dictSearchBtn = document.getElementById("dictSearchBtn");
  const dictStatus = document.getElementById("dictStatus");
  const dictResults = document.getElementById("dictResults");
  const SINHALA_RE = /[\u0D80-\u0DFF]/;

  let meaningsLoadState = "idle"; // idle | loading | ready | error
  function ensureMeaningsLoaded() {
    if (meaningsLoadState === "ready" || meaningsLoadState === "loading") return;
    meaningsLoadState = "loading";
    dictStatus.hidden = false;
    dictStatus.textContent = "Loading dictionary (first time only)…";
    Promise.all([
      fetch("meanings.json").then(r => r.json()),
      fetch("meanings_si.json").then(r => r.json())
    ]).then(([enSi, siEn]) => {
      state.meaningsEnSi = enSi;
      state.meaningsSiEn = siEn;
      meaningsLoadState = "ready";
      dictStatus.hidden = true;
    }).catch(() => {
      meaningsLoadState = "error";
      dictStatus.textContent = "Couldn't load the dictionary — check your connection and try again.";
    });
  }

  function lookupMeaning(word) {
    if (!word || meaningsLoadState !== "ready") return null;
    const trimmed = word.trim();
    if (!trimmed) return null;
    if (SINHALA_RE.test(trimmed)) {
      const hit = state.meaningsSiEn[trimmed];
      return hit ? { word: trimmed, direction: "si→en", meanings: hit } : null;
    }
    const lower = trimmed.toLowerCase();
    const hit = state.meaningsEnSi[lower] || state.meaningsEnSi[trimmed];
    return hit ? { word: trimmed, direction: "en→si", meanings: hit } : null;
  }

  function renderDictResults(result, queryWord) {
    if (!result) {
      dictResults.innerHTML = `<div class="dict-empty">No entry found for "<strong>${queryWord}</strong>". Try a different spelling.</div>`;
      return;
    }
    const chips = result.meanings.slice(0, 20).map(m => `<span class="dict-meaning-chip">${m}</span>`).join("");
    dictResults.innerHTML = `
      <div class="dict-entry">
        <div class="dict-entry-word">${result.word} <span class="dict-entry-dir">${result.direction}</span></div>
        <div class="dict-meaning-list">${chips}</div>
      </div>`;
  }

  function runDictSearch() {
    const q = dictSearchInput.value.trim();
    if (!q) return;
    if (meaningsLoadState !== "ready") { ensureMeaningsLoaded(); return; }
    renderDictResults(lookupMeaning(q), q);
  }
  dictSearchBtn.addEventListener("click", runDictSearch);
  dictSearchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") runDictSearch(); });
  dictSearchInput.addEventListener("focus", ensureMeaningsLoaded);

  // Double-click a word anywhere in the main editor to see its meaning — loads the
  // dictionary lazily on first use so it never slows down initial typing.
  editor.addEventListener("dblclick", () => {
    const word = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    if (!word || /\s/.test(word)) return;
    if (meaningsLoadState !== "ready") {
      ensureMeaningsLoaded();
      showToast("Loading dictionary… double-click the word again in a moment");
      return;
    }
    const result = lookupMeaning(word);
    if (result) {
      showToast(word + " — " + result.meanings.slice(0, 3).join(", "));
    } else {
      showToast("No dictionary entry for \"" + word + "\"");
    }
  });

  /* ----------------------------------------------------------------------
   * 13. GUIDE TAB
   * -------------------------------------------------------------------- */
  const VOWEL_ITEMS = [
    ["a", "අ"], ["aa", "ආ"], ["A", "ඇ"], ["Aa / AA", "ඈ"], ["i", "ඉ"], ["ii", "ඊ"],
    ["u", "උ"], ["uu", "ඌ"], ["R", "ඍ"], ["Ru", "ඎ"], ["e", "එ"], ["ee", "ඒ"],
    ["ai", "ඓ"], ["o", "ඔ"], ["oo", "ඕ"], ["au / ou", "ඖ"]
  ];
  const CONSONANT_ITEMS = [
    ["k", "ක"], ["g", "ග"], ["ch", "ච"], ["j", "ජ"], ["t", "ට"], ["d", "ඩ"],
    ["th", "ත"], ["dh / q", "ද"], ["n", "න"], ["N", "ණ"], ["p", "ප"], ["b", "බ"],
    ["m", "ම"], ["y", "ය"], ["r", "ර"], ["l", "ල"], ["L", "ළ"], ["w / v", "ව"],
    ["s", "ස"], ["sh", "ශ"], ["S / Sh", "ෂ"], ["h", "හ"], ["f", "ෆ"], ["X", "ඞ"]
  ];
  const ASPIRATE_ITEMS = [
    ["kh", "ඛ"], ["gh", "ඝ"], ["chh", "ඡ"], ["T", "ඨ"], ["D", "ඪ"],
    ["thh", "ථ"], ["dhh", "ධ"], ["ph", "ඵ"], ["bh", "භ"]
  ];
  const SANNAKA_ITEMS = [
    ["zg", "ඟ"], ["zj", "ඦ"], ["zd", "ඬ"], ["zdh / zq", "ඳ"],
    ["zk", "ඤ"], ["zh", "ඥ"], ["B", "ඹ"], ["Lu", "ළු"]
  ];
  const PILI_ITEMS = [
    ["k", "ක්"], ["ka", "ක"], ["kaa", "කා"], ["kA", "කැ"], ["kAa", "කෑ"], ["ki", "කි"],
    ["kii", "කී"], ["ku", "කු"], ["kuu", "කූ"], ["kru", "කෘ"], ["kruu", "කෲ"], ["ke", "කෙ"],
    ["kee", "කේ"], ["kai", "කෛ"], ["ko", "කො"], ["koo", "කෝ"], ["kau", "කෞ"],
    ["kya", "ක්‍ය"], ["kra", "ක්‍ර"]
  ];
  const SPECIAL_ITEMS = [
    ["\\n / zn", "ං (Anusvara)"], ["\\h / H", "ඃ (Visarga)"], ["\\N", "ඞ"],
    ["\\r", "ර්‍ (Repaya, before next consonant)"],
    ["Xr + vowel", "X්‍ර… (Rakaransha) — e.g. kra → ක්‍ර"],
    ["Xy + vowel", "X්‍ය… (Yansaya, automatic) — e.g. vidya → විද්‍යා"]
  ];
  const EXAMPLE_ITEMS = [
    ["mama gedara yanawa", "මම ගෙදර යනවා"],
    ["oyage nama mokakdha", "ඔයගෙ නම මොකක්ද"],
    ["subha aluth avurudhak", "සුභ අලුත් අවුරුද්දක්"],
    ["sri lanka", "ශ්‍රී ලංකා"],
    ["kohomadha", "කොහොමද"],
    ["vidyava", "විද්‍යාව"]
  ];
  function buildGuideTables() {
    const render = (id, items) => {
      document.getElementById(id).innerHTML = items.map(([k, v]) =>
        `<div class="scheme-item"><code>${k}</code><span class="glyph">${v}</span></div>`).join("");
    };
    render("vowelGrid", VOWEL_ITEMS);
    render("consonantGrid", CONSONANT_ITEMS);
    render("aspirateGrid", ASPIRATE_ITEMS);
    render("sannakaGrid", SANNAKA_ITEMS);
    render("piliGrid", PILI_ITEMS);
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
