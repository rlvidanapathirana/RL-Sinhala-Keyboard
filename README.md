# RL Sinhala Keyboard

A complete, browser-based Sinhala typing tool — Singlish → Unicode live transliteration, voice typing, word suggestions, and bidirectional Unicode ⇄ FM Abhaya / ISI legacy font conversion. Pure HTML/CSS/JS, no build step, works on GitHub Pages.

**Developed by V.P.R. Lakshan Vidanapathirana**
Portfolio: [lakshan.vercel.app](https://lakshan.vercel.app) · rlvidanapathirana@gmail.com

## Features

- ⌨️ **Singlish → Unicode**: type in Latin script, get live Sinhala Unicode as you type (word-scoped composition, so multi-letter phonemes like `th`, `sh`, `kh` never get corrupted mid-word).
- 🎙️ **Voice typing**: Sinhala (si-LK) speech-to-text using the Web Speech API (Chrome recommended).
- 💡 **Word suggestions**: live suggestions from a 24,900+ word Sinhala dictionary as you type.
- 🔄 **Legacy font converter**: convert Unicode ⇄ FM Abhaya and Unicode ⇄ ISI, both directions, using a 1,600+ entry mapping table with longest-match substitution.
- 📋 **Copy as…**: copy your text as Unicode, FM Abhaya, or ISI directly (matches the "Copy as FM Abhaya / Copy as ISI" workflow).
- ⌨️ **On-screen virtual keyboard** for direct Sinhala glyph entry.
- 📖 **Built-in scheme guide** so anyone can learn the typing convention in a minute.
- 🌿 Fully responsive, Ceylon-tea-green design system.

## Files

```
index.html      Markup
style.css       Design system & responsive layout
script.js       All application logic
mapping.json    Unicode ⇄ FM Abhaya ⇄ ISI conversion table
words.json      Sinhala word list (suggestions)
```

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push this folder to a repository.
2. Repo Settings → Pages → Deploy from branch → select `main` / root.
3. Done — no build step needed.

## Notes on legacy fonts

FM Abhaya and ISI are byte-mapped "ANSI" Sinhala fonts (pre-Unicode era). Converting Unicode text to FM/ISI produces the correct byte sequence, but it will only **display** correctly in an application where the matching font (FM Abhaya / ISI Wijesekara) is installed and applied to that text — this is normal legacy-font behavior, not a bug. The Font Converter tab includes an optional "load your own font file" preview so you can proof the output visually before pasting it into Word or elsewhere.

## Credits / data sources

Conversion tables and word list adapted from open-source Sinhala language resources; transliteration scheme adapted and hardened from a Singlish transliteration reference implementation. Rebuilt, restructured, and redesigned by V.P.R. Lakshan Vidanapathirana.
