# RL Sinhala Keyboard — V5.0

A complete, modern, installable web app for Sinhala typing — Singlish → Unicode live transliteration backed by a real 145,000-entry dictionary, bilingual voice + keyboard typing, Google-style numbered word prediction, a built-in English ⇄ Sinhala dictionary, and bidirectional Unicode ⇄ FM Abhaya / ISI legacy font conversion (typeable in Singlish too). Pure HTML/CSS/JS, no build step, works on GitHub Pages.

**Developed by V.P.R. Lakshan Vidanapathirana**
Portfolio: [lakshan.vercel.app](https://lakshan.vercel.app) · rlvidanapathirana@gmail.com

## What's new in V5.0

- 📘 **New Dictionary tab** — a full English ⇄ Sinhala dictionary (130,000+ entries), searchable directly in the app, with automatic language detection. Double-click any word in the Type tab to see its meaning instantly, like a built-in "Dictionary Anywhere". Built entirely from offline data — no dependency on a third-party API, so it never breaks, rate-limits, or needs a server.
- ⌨️ **Font Converter now accepts Singlish input.** When converting Unicode → FM Abhaya/ISI, you can type directly in Singlish in the input box and it'll transliterate live, exactly like the main Type tab — no more needing to type or paste Unicode text first.
- 🐛 **More caret-positioning correctness** — the Font Size setting could previously leave the suggestion popup's position stale after a size change; it now re-measures correctly every time.
- ⚡ Continued performance and accuracy work across the whole suggestion and conversion pipeline.

## Why not the referenced googleDictionaryAPI?

That project (and its various forks) scrapes Google's own dictionary UI rather than using an official API — most public instances are unreliable, rate-limited, or offline entirely, and it only covers English definitions (not Sinhala). Since you already had a proper English ⇄ Sinhala dataset in your RL Dictionary project, building the lookup from that instead gives the same "double-click a word for its meaning" experience, but reliably, offline, and bilingually — without depending on someone else's scraper staying alive.

## Features

- ⌨️ **Singlish → Unicode**: type in Latin script, get live Sinhala Unicode as you type (word-scoped composition, so multi-letter phonemes like `th`, `sh`, `kh`, and `y`-conjuncts like `dya`, never get corrupted mid-word).
- 🎙️ **Bilingual voice + keyboard typing**: a single Sinhala/English toggle governs both speech recognition language and whether keyboard input gets transliterated.
- 💬 **Floating compose popup**: a Google Input Tools-style vertical list above your cursor, numbered 1–9 — press the number key, click, or use arrow keys + Enter to pick a word.
- 💡 **Word prediction**: dictionary-verified spellings first (145,000 entries), prefix-completion for longer words, frequency-ranked fallback from a 30,000-word corpus, and your raw typed text always available as a fallback option.
- 📘 **Built-in dictionary**: 130,000+ entry English ⇄ Sinhala lookup, searchable or via double-click.
- 🔄 **Legacy font converter**: convert Unicode ⇄ FM Abhaya and Unicode ⇄ ISI, both directions, typeable in Singlish, using a 1,600+ entry mapping table with longest-match substitution.
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
meanings.json        English → Sinhala dictionary (49k entries, lazy-loaded)
meanings_si.json     Sinhala → English dictionary (86k entries, lazy-loaded)
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

Note: `fuzzy.json` is about 6MB uncompressed, and `meanings.json`/`meanings_si.json` (used by the Dictionary tab and double-click lookup) are about 4.5MB each. GitHub Pages serves them all gzip-compressed automatically. `fuzzy.json` loads in the background right away so typing/suggestions work fully within a second or two; the two dictionary files only load the first time you open the Dictionary tab or double-click a word, so they never slow down initial page load. The service worker caches everything after first use for instant, offline access afterwards.

## Notes on legacy fonts

FM Abhaya and ISI are byte-mapped "ANSI" Sinhala fonts (pre-Unicode era). Converting Unicode text to FM/ISI produces the correct byte sequence, but it will only **display** correctly in an application where the matching font (FM Abhaya / ISI Wijesekara) is installed and applied to that text — this is normal legacy-font behavior, not a bug. The Font Converter tab includes an optional "load your own font file" preview so you can proof the output visually before pasting it into Word or elsewhere.

## Notes on voice typing

Browsers only support one recognition language per session. The Sinhala/English toggle switches which one is active, and text is inserted exactly as the speech engine returns it — Sinhala speech becomes Sinhala script, English speech stays in English, with no transliteration applied either way. True automatic mid-sentence language detection isn't something the browser's Web Speech API exposes today.

## Data sources & credits

- Singlish → Sinhala dictionary (`fuzzy.json`) and word frequency data adapted from your RL Dictionary project's Sinhala-English datasets.
- Word frequency data: *Fernando, A. & Dias, G. (2021). "Building a Linguistic Resource: A Word Frequency List for Sinhala." Proceedings of ICON 2021.*
- Conversion tables and base word list adapted from open-source Sinhala language resources; transliteration scheme adapted and hardened from a Singlish transliteration reference implementation.
- Rebuilt, restructured, and redesigned by V.P.R. Lakshan Vidanapathirana.

