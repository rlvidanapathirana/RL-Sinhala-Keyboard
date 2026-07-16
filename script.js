/* =========================================================================
   RL Sinhala Keyboard — script.js
   Developed by V.P.R. Lakshan Vidanapathirana
   Features: Singlish→Unicode live transliteration, word suggestions,
   voice typing (si-LK), Unicode⇄FM Abhaya⇄ISI legacy font conversion,
   on-screen virtual keyboard.
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
    ["r", "ර"] // must stay last (Rakaransha handling depends on this)
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
      for (const [c, cu] of CONSONANTS) {
        text = text.replace(new RegExp(c + sc, "g"), cu + scu);
      }
    }
    for (const [c, cu] of CONSONANTS) {
      for (const [v, , vm] of VOWELS) {
        text = text.replace(new RegExp(c + "r" + v, "g"), cu + "්\u200Dර" + vm);
      }
      text = text.replace(new RegExp(c + "r", "g"), cu + "්\u200Dර");
    }
    for (const [c, cu] of CONSONANTS) {
      for (const [v, , vm] of VOWELS) {
        text = text.replace(new RegExp(c + v, "g"), cu + vm);
      }
    }
    for (const [c, cu] of CONSONANTS) {
      text = text.replace(new RegExp(c, "g"), cu + "්");
    }
    for (const [v, vu] of VOWELS) {
      text = text.replace(new RegExp(v, "g"), vu);
    }
    return text;
  }

  const LATIN_WORD_CHAR = /[A-Za-z\\/)]/;

  /* ----------------------------------------------------------------------
   * 2. DATA LOADING (mapping + word list)
   * -------------------------------------------------------------------- */
  const state = {
    mapping: [],
    words: [],
    uniToFm: new Map(), uniToIsi: new Map(),
    fmToUni: new Map(), isiToUni: new Map(),
    maxUniLen: 1, maxFmLen: 1, maxIsiLen: 1
  };

  function buildLongestMatchMap(pairs, keyIdx, valIdx) {
    const map = new Map();
    let maxLen = 1;
    for (const item of pairs) {
      const k = item[keyIdx], v = item[valIdx];
      if (!k || !v) continue;
      if (!map.has(k)) map.set(k, v);
      if (k.length > maxLen) maxLen = k.length;
    }
    return { map, maxLen };
  }

  function longestMatchConvert(text, map, maxLen) {
    let out = "";
    let i = 0;
    const n = text.length;
    while (i < n) {
      let matched = false;
      const upper = Math.min(maxLen, n - i);
      for (let l = upper; l >= 1; l--) {
        const sub = text.substr(i, l);
        if (map.has(sub)) {
          out += map.get(sub);
          i += l;
          matched = true;
          break;
        }
      }
      if (!matched) { out += text[i]; i += 1; }
    }
    return out;
  }

  async function loadData() {
    try {
      const [mapRes, wordsRes] = await Promise.all([
        fetch("mapping.json"), fetch("words.json")
      ]);
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
  }

  function toFm(uniText) { return longestMatchConvert(uniText, state.uniToFm, state.maxUniLen); }
  function toIsi(uniText) { return longestMatchConvert(uniText, state.uniToIsi, state.maxUniLen); }
  function fmToUnicode(fmText) { return longestMatchConvert(fmText, state.fmToUni, state.maxFmLen); }
  function isiToUnicode(isiText) { return longestMatchConvert(isiText, state.isiToUni, state.maxIsiLen); }

  /* ----------------------------------------------------------------------
   * 3. TOAST
   * -------------------------------------------------------------------- */
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  async function copyToClipboard(text, label) {
    if (!text) { showToast("Copy කරන්න පෙළක් නෑ"); return; }
    try {
      await navigator.clipboard.writeText(text);
      showToast((label || "Text") + " copy කළා ✓");
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); showToast((label || "Text") + " copy කළා ✓"); }
      catch (e) { showToast("Copy වුනේ නෑ — manually select කරන්න"); }
      document.body.removeChild(ta);
    }
  }

  /* ----------------------------------------------------------------------
   * 4. TAB SWITCHING
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
    });
  });

  /* ----------------------------------------------------------------------
   * 5. MAIN EDITOR — composing state machine
   * -------------------------------------------------------------------- */
  const editor = document.getElementById("editor");
  const suggestionsRow = document.getElementById("suggestionsRow");
  const suggChips = document.getElementById("suggChips");
  const charCountEl = document.getElementById("charCount");
  const wordCountEl = document.getElementById("wordCount");

  let pending = "";       // raw latin buffer currently being composed
  let pendingStart = null; // index in editor.value where the live preview sits
  let previewLen = 0;      // length of the currently-rendered preview text

  function currentPreview() { return transliterate(pending); }

  function isCursorAtPendingEnd() {
    return pendingStart !== null && editor.selectionStart === pendingStart + previewLen
      && editor.selectionEnd === pendingStart + previewLen;
  }

  function resetPending() {
    pending = ""; pendingStart = null; previewLen = 0;
    renderSuggestions("");
  }

  function renderPreview() {
    const preview = currentPreview();
    const before = editor.value.slice(0, pendingStart);
    const after = editor.value.slice(pendingStart + previewLen);
    editor.value = before + preview + after;
    previewLen = preview.length;
    const pos = pendingStart + previewLen;
    editor.setSelectionRange(pos, pos);
    renderSuggestions(preview);
    updateCounts();
  }

  function renderSuggestions(prefix) {
    if (!prefix || !state.words.length) {
      suggestionsRow.hidden = true; suggChips.innerHTML = ""; return;
    }
    const matches = [];
    for (let i = 0; i < state.words.length && matches.length < 6; i++) {
      if (state.words[i].startsWith(prefix)) matches.push(state.words[i]);
    }
    if (!matches.length) { suggestionsRow.hidden = true; suggChips.innerHTML = ""; return; }
    suggChips.innerHTML = "";
    matches.forEach(word => {
      const chip = document.createElement("button");
      chip.className = "sugg-chip";
      chip.type = "button";
      chip.textContent = word;
      chip.addEventListener("mousedown", (e) => {
        e.preventDefault();
        applySuggestion(word);
      });
      suggChips.appendChild(chip);
    });
    suggestionsRow.hidden = false;
  }

  function applySuggestion(word) {
    const before = editor.value.slice(0, pendingStart);
    const after = editor.value.slice(pendingStart + previewLen);
    const insert = word + " ";
    editor.value = before + insert + after;
    const pos = before.length + insert.length;
    editor.setSelectionRange(pos, pos);
    resetPending();
    editor.focus();
    updateCounts();
  }

  function updateCounts() {
    const val = editor.value;
    charCountEl.textContent = val.length + " අකුරු";
    const words = val.trim().length ? val.trim().split(/\s+/).length : 0;
    wordCountEl.textContent = words + " වචන";
  }

  editor.addEventListener("beforeinput", (e) => {
    const type = e.inputType;

    if (type === "insertText" && e.data) {
      // If cursor isn't contiguous with an active pending word, start fresh
      if (pending && !isCursorAtPendingEnd()) resetPending();

      // Only compose latin word characters; everything else finalizes & passes through
      const isWordChar = [...e.data].every(ch => LATIN_WORD_CHAR.test(ch));
      if (isWordChar) {
        e.preventDefault();
        if (pendingStart === null) {
          const selStart = editor.selectionStart, selEnd = editor.selectionEnd;
          if (selEnd > selStart) {
            editor.value = editor.value.slice(0, selStart) + editor.value.slice(selEnd);
          }
          pendingStart = selStart;
        }
        pending += e.data;
        renderPreview();
      } else {
        resetPending();
        // let default insertion happen (space/punctuation/digit/etc.)
      }
      return;
    }

    if (type === "deleteContentBackward") {
      if (pending && isCursorAtPendingEnd()) {
        e.preventDefault();
        pending = pending.slice(0, -1);
        if (!pending) {
          // remove the now-empty preview entirely
          const before = editor.value.slice(0, pendingStart);
          const after = editor.value.slice(pendingStart + previewLen);
          editor.value = before + after;
          editor.setSelectionRange(pendingStart, pendingStart);
          resetPending();
          updateCounts();
        } else {
          renderPreview();
        }
      } else {
        resetPending();
      }
      return;
    }

    // Any other input type (paste, line break, delete forward, composition, etc.)
    resetPending();
  });

  // Cursor moved away (click / arrow keys) -> finalize pending composition
  editor.addEventListener("keyup", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
      if (pending && !isCursorAtPendingEnd()) resetPending();
    }
  });
  editor.addEventListener("click", () => {
    if (pending && !isCursorAtPendingEnd()) resetPending();
  });
  editor.addEventListener("blur", () => {
    if (pending) resetPending();
  });
  editor.addEventListener("input", updateCounts);

  updateCounts();

  /* ----------------------------------------------------------------------
   * 6. VOICE TYPING (Web Speech API, si-LK)
   * -------------------------------------------------------------------- */
  const micBtn = document.getElementById("micBtn");
  const micStatus = document.getElementById("micStatus");
  const micStatusText = document.getElementById("micStatusText");
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;

  if (SpeechRecognitionCtor) {
    recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "si-LK";

    recognition.onstart = () => {
      isRecording = true;
      micBtn.classList.add("recording");
      micStatus.hidden = false;
      micStatusText.textContent = "ඇහුම්කන් දෙමින්… කථා කරන්න";
    };
    recognition.onerror = (e) => {
      micStatusText.textContent = "දෝෂයක් — නැවත උත්සාහ කරන්න (" + e.error + ")";
    };
    recognition.onend = () => {
      isRecording = false;
      micBtn.classList.remove("recording");
      micStatus.hidden = true;
    };
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText) {
        if (pending) resetPending();
        const pos = editor.selectionStart;
        const before = editor.value.slice(0, pos);
        const after = editor.value.slice(pos);
        const insert = finalText.trim() + " ";
        editor.value = before + insert + after;
        const newPos = before.length + insert.length;
        editor.setSelectionRange(newPos, newPos);
        updateCounts();
      }
    };

    micBtn.addEventListener("click", () => {
      if (isRecording) { recognition.stop(); }
      else {
        if (pending) resetPending();
        editor.focus();
        try { recognition.start(); } catch (err) { /* already started */ }
      }
    });
  } else {
    micBtn.disabled = true;
    micBtn.title = "මෙම browser එකේ Voice Typing සහාය නොදක්වයි (Chrome භාවිතා කරන්න)";
    micBtn.style.opacity = "0.5";
  }

  /* ----------------------------------------------------------------------
   * 7. VIRTUAL KEYBOARD
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
      key.addEventListener("mousedown", (e) => {
        e.preventDefault();
        insertAtCursor(ch);
      });
      virtualKeyboard.appendChild(key);
    });
    addRow(VK_VOWELS);
    addRow(VK_CONSONANTS);
    addRow(VK_MODIFIERS);
    const spaceKey = document.createElement("button");
    spaceKey.type = "button"; spaceKey.className = "vk-key space"; spaceKey.textContent = "SPACE";
    spaceKey.addEventListener("mousedown", (e) => { e.preventDefault(); insertAtCursor(" "); });
    virtualKeyboard.appendChild(spaceKey);
  }

  function insertAtCursor(str) {
    if (pending) resetPending();
    editor.focus();
    const pos = editor.selectionStart;
    const before = editor.value.slice(0, pos);
    const after = editor.value.slice(pos);
    editor.value = before + str + after;
    const newPos = pos + str.length;
    editor.setSelectionRange(newPos, newPos);
    updateCounts();
  }

  kbToggleBtn.addEventListener("click", () => {
    virtualKeyboard.hidden = !virtualKeyboard.hidden;
    kbToggleBtn.classList.toggle("tool-active", !virtualKeyboard.hidden);
    if (!virtualKeyboard.hidden && !virtualKeyboard.childElementCount) buildVirtualKeyboard();
  });

  /* ----------------------------------------------------------------------
   * 8. CLEAR / COPY / DOWNLOAD
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
    showToast("Download කළා ✓");
  });

  /* ----------------------------------------------------------------------
   * 9. FONT CONVERTER TAB
   * -------------------------------------------------------------------- */
  const convertDirection = document.getElementById("convertDirection");
  const convertInput = document.getElementById("convertInput");
  const convertOutput = document.getElementById("convertOutput");
  const convertInputLabel = document.getElementById("convertInputLabel");
  const convertOutputLabel = document.getElementById("convertOutputLabel");

  const DIRECTION_LABELS = {
    uni2fm: ["Input (Unicode)", "Output (FM Abhaya)"],
    uni2isi: ["Input (Unicode)", "Output (ISI)"],
    fm2uni: ["Input (FM Abhaya)", "Output (Unicode)"],
    isi2uni: ["Input (ISI)", "Output (Unicode)"]
  };

  function updateConvertLabels() {
    const [inLabel, outLabel] = DIRECTION_LABELS[convertDirection.value];
    convertInputLabel.textContent = inLabel;
    convertOutputLabel.textContent = outLabel;
    convertOutput.classList.toggle("legacy-preview", convertDirection.value.startsWith("uni2"));
  }
  convertDirection.addEventListener("change", updateConvertLabels);
  updateConvertLabels();

  function runConvert() {
    const val = convertInput.value;
    let out = "";
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
    const tmp = convertInput.value;
    convertInput.value = convertOutput.value;
    convertOutput.value = tmp;
    updateConvertLabels();
    runConvert();
  });

  document.getElementById("copyOutputBtn").addEventListener("click", () => copyToClipboard(convertOutput.value, "Output"));
  document.getElementById("pasteInputBtn").addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      convertInput.value = text; runConvert();
    } catch (err) { showToast("Clipboard access permission නෑ — manually paste කරන්න (Ctrl+V)"); }
  });

  // Optional legacy font preview loader (client-side only)
  const fontFileInput = document.getElementById("fontFileInput");
  fontFileInput.addEventListener("change", () => {
    const file = fontFileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const fontFace = new FontFace("RLLegacyPreviewFont", `url(${url})`);
    fontFace.load().then(loaded => {
      document.fonts.add(loaded);
      convertOutput.style.fontFamily = "'RLLegacyPreviewFont', sans-serif";
      showToast("Font load කළා — preview එක update වුනා ✓");
    }).catch(() => showToast("Font load වුනේ නෑ — file එක check කරන්න"));
  });

  /* ----------------------------------------------------------------------
   * 10. GUIDE TAB — build scheme + example tables
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
    ["R / \\r", "ර්‍ (Repaya — යට රකාරය)"], ["Y", "‍ය (Yansaya)"],
    ["Xr + vowel", "X්‍ර... (Rakaransha) — උදා: kra → ක්‍ර"],
    ["Xru", "Xෘ — උදා: kru → කෘ"], ["Xruu", "Xෲ — උදා: kruu → කෲ"]
  ];
  const EXAMPLE_ITEMS = [
    ["mama gedara yanawa", "මම ගෙදර යනවා"],
    ["oyage nama mokakdha", "ඔයගෙ නම මොකක්ද"],
    ["subha aluth avurudhak", "සුභ අලුත් අවුරුද්දක්"],
    ["sri lanka", "ශ්‍රී ලංකා"],
    ["kohomadha", "කොහොමද"]
  ];

  function buildGuideTables() {
    const schemeGrid = document.getElementById("schemeGrid");
    schemeGrid.innerHTML = SCHEME_ITEMS.map(([k, v]) =>
      `<div class="scheme-item"><code>${k}</code><span class="glyph">${v}</span></div>`
    ).join("");

    const specialGrid = document.getElementById("specialGrid");
    specialGrid.innerHTML = SPECIAL_ITEMS.map(([k, v]) =>
      `<div class="scheme-item"><code>${k}</code><span class="glyph" style="font-size:14px">${v}</span></div>`
    ).join("");

    const exampleGrid = document.getElementById("exampleGrid");
    exampleGrid.innerHTML = EXAMPLE_ITEMS.map(([inp, out]) =>
      `<div class="example-row"><span class="in">${inp}</span><span class="out">${out}</span></div>`
    ).join("");
  }
  buildGuideTables();

  /* ----------------------------------------------------------------------
   * 11. INIT
   * -------------------------------------------------------------------- */
  loadData();

})();
