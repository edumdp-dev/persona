# Lucas Costa — Interview Persona

English class (Germinare Tech · Business 3 · Unit 3) job-interview simulation.
Candidate: **Lucas Costa**, 24, Business Administration at FEA-USP, applying to **PicPay** as **Junior Customer Experience Analyst**.

Live: https://persona.duds.dev

- `content.json` — persona + 22 answers (source of truth; copy kept in `public/content.json`)
- `public/` — static site: Persona, Memorize (first letters / cloze / TTS), Flashcards, Practice (typed/voice diff), Exam simulator
- `Lucas_Costa_Interview_Answers.pdf` — answered worksheet + cheat sheet (source: `pdf/answers.html`)

Regenerate PDF:

```bash
"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="$PWD/Lucas_Costa_Interview_Answers.pdf" "file:///$PWD/pdf/answers.html"
cp Lucas_Costa_Interview_Answers.pdf public/
```

Deploy: `npx wrangler deploy`
