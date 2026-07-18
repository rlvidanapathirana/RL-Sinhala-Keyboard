# RL Sinhala Keyboard — V4.1

A complete, modern, installable web app for Sinhala typing — Singlish → Unicode live transliteration backed by a real 145,000-entry dictionary, bilingual voice + keyboard typing, Google-style numbered word prediction, and bidirectional Unicode ⇄ FM Abhaya / ISI legacy font conversion. Pure HTML/CSS/JS, no build step, works on GitHub Pages.

**Developed by V.P.R. Lakshan Vidanapathirana**
Portfolio: [lakshan.vercel.app](https://lakshan.vercel.app) · rlvidanapathirana@gmail.com

## What's new in V4.1

- 🔤 **Fixed yansaya conjuncts** (e.g. `vidya` → විද්‍යා). Previously, a consonant followed by plain `y` didn't get the zero-width joiner needed to form a proper conjunct, so words like this rendered as two separate letters instead of one joined glyph. This now happens automatically, the same way rakaransha (`r`) already did.
- 🔮 **Prefix-completion predictions.** Suggestions no longer just show the literal conversion of what you've typed — they now also search the dictionary for longer real words that *start with* your prefix, so typing `patam` correctly predicts **පාඨමාලාව**, not just පඨම්.
- 🌐 **The සිං/EN toggle now controls keyboard typing too**, not just voice. Switch to EN and typed letters stay plain English — no more fighting the transliteration engine to type an English word.
- ⚡ **Smoother, faster live typing.** The caret-position calculation (used to position the suggestion popup) was recreating a DOM element on every single keystroke — that's fixed to reuse one cached element instead, which was the main source of typing lag. The transliteration engine's regular expressions are now also precompiled once at startup rather than rebuilt on every keystroke.
- 📖 **Guide tab expanded** — a full "how suggestions work", "using the popup", and "if the word isn't suggested" section, plus documentation for the new automatic yansaya behavior.

## Features

- ⌨️ **Singlish → Unicode**: type in Latin script, get live Sinhala Unicode as you type (word-scoped composition, so multi-letter phonemes like `th`, `sh`, `kh`, and now `y`-conjuncts like `dya`, never get corrupted mid-word).
- 🎙️ **Bilingual voice + keyboard typing**: a single Sinhala/English toggle governs both speech recognition language and whether keyboard input gets transliterated.
- 💬 **Floating compose popup**: a Google Input Tools-style vertical list above your cursor, numbered 1–9 — press the number key, click, or use arrow keys + Enter to pick a word.
- 💡 **Word prediction**: dictionary-verified spellings first (145,000 entries), prefix-completion for longer words, frequency-ranked fallback from a 30,000-word corpus, and your raw typed text always available as a fallback option.
- 🔄 **Legacy font converter**: convert Unicode ⇄ FM Abhaya and Unicode ⇄ ISI, both directions, using a 1,600+ entry mapping table with longest-match substitution.
- 📋 **Copy as…**: copy your text as Unicode, FM Abhaya, or ISI directly.
- ⌨️ **On-screen virtual keyboard** for direct Sinhala glyph entry.
- ⚙️ **Settings**: auto-copy to clipboard, sound effects, dark mode, real-time vs. word-boundary conversion, adjustable font size — all persisted locally.
- 📲 **Installable app (PWA)** with offline support — "Install" on desktop/Android, "Add to Home Screen" on iPhone.
- 📖 **Built-in scheme guide** so anyone can learn the typing convention in a minute.
- 🌿 Fully responsive — desktop, Android, and iPhone Safari.

## Files

```
index.html          Markup
style.css            Design system, animated background, dark mode, responsive layout
script.js            All application logic
mapping.json         Unicode ⇄ FM Abhaya ⇄ ISI conversion table
words.json           Frequency-ranked Sinhala word list (fallback predictions)
fuzzy.json           Dictionary-verified Singlish → Sinhala candidate spellings (145k entries)
manifest.json        PWA manifest (installable app)
service-worker.js    Offline caching for installed app
assets/              Logo, icons, favicon
```

## Run locally

Just open `index.html` in a browser, or serve the folder (needed for `fetch()` of the JSON data and for the service worker):

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push this folder to a repository.
2. Repo Settings → Pages → Deploy from branch → select `main` / root.
3. Done — no build step needed. PWA install will work automatically once served over HTTPS.

Note: `fuzzy.json` is about 6MB uncompressed. GitHub Pages serves it gzip-compressed automatically, and the service worker caches it after first load so repeat visits and offline use are instant — but the very first load will fetch it in the background (typing works immediately using the live engine; dictionary-backed suggestions kick in a moment later once it's loaded).

## Notes on legacy fonts

FM Abhaya and ISI are byte-mapped "ANSI" Sinhala fonts (pre-Unicode era). Converting Unicode text to FM/ISI produces the correct byte sequence, but it will only **display** correctly in an application where the matching font (FM Abhaya / ISI Wijesekara) is installed and applied to that text — this is normal legacy-font behavior, not a bug. The Font Converter tab includes an optional "load your own font file" preview so you can proof the output visually before pasting it into Word or elsewhere.

## Notes on voice typing

Browsers only support one recognition language per session. The Sinhala/English toggle switches which one is active, and text is inserted exactly as the speech engine returns it — Sinhala speech becomes Sinhala script, English speech stays in English, with no transliteration applied either way. True automatic mid-sentence language detection isn't something the browser's Web Speech API exposes today.

## Data sources & credits

- Singlish → Sinhala dictionary (`fuzzy.json`) and word frequency data adapted from your RL Dictionary project's Sinhala-English datasets.
- Word frequency data: *Fernando, A. & Dias, G. (2021). "Building a Linguistic Resource: A Word Frequency List for Sinhala." Proceedings of ICON 2021.*
- Conversion tables and base word list adapted from open-source Sinhala language resources; transliteration scheme adapted and hardened from a Singlish transliteration reference implementation.
- Rebuilt, restructured, and redesigned by V.P.R. Lakshan Vidanapathirana.

