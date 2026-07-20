# SBS Summer Camp — Generative AI

Course material for the **SBS Community Generative AI Summer Camp** — four evenings that
take a from-zero audience to building and shipping a small AI app.

**Instructor:** Eng. Moaz Eldegwy · AI Engineer
[moazeldegwy.com](https://moazeldegwy.com) · [LinkedIn](https://www.linkedin.com/in/moaz-eldegwy/)

Everything here is static HTML — the slides, the quizzes, all of it. No build step,
no server, no dependencies. Open a file locally or hit the GitHub Pages URL.

---

## For students

Start at the course hub:

**https://moaz-eldegwy.github.io/sbs-summer-camp/**

From there you can open any published session deck or take any quiz. Direct links:

| Session | Topic | Date | Slides | Quiz |
|:-------:|-------|------|--------|------|
| 1 | Welcome to Generative AI | Mon 20 Jul | [Open deck](sessions/session-1/presenter.html) | [Quiz 1](quizzes/quiz1.html) |
| 2 | Under the Hood + Run One Yourself | Thu 23 Jul | _coming soon_ | [Quiz 2](quizzes/quiz2.html) |
| 3 | Make Models Do What You Want | Mon 27 Jul | _coming soon_ | [Quiz 3](quizzes/quiz3.html) |
| 4 | Build & Ship + Use It Responsibly | Thu 30 Jul | _coming soon_ | [Quiz 4](quizzes/quiz4.html) |

Sessions 2–4 include hands-on code, which runs in **Google Colab** — nothing to install.
Colab links live in each session's `README.md`.

---

## What each session covers

**Session 1 — Welcome to Generative AI**
What "generating" means versus AI that only classifies · a fast tour across text, image,
audio and code · why it all exploded now · an honest map of strengths and weaknesses ·
and the one secret: these systems just predict the next piece.

**Session 2 — Under the Hood + Run One Yourself**
Next-token prediction and everything that falls out of it — fluency, hallucination,
temperature · tokens and embeddings by analogy · what pretraining is · then loading a
pretrained model with a Hugging Face pipeline.

**Session 3 — Make Models Do What You Want**
Three levers in order of effort: prompt engineering (zero/few-shot, roles, structure,
chain-of-thought), RAG, and fine-tuning — plus the decision framework for when to reach
for each.

**Session 4 — Build & Ship + Use It Responsibly**
Assemble a document-Q&A chatbot with RAG · a look at other modalities and agents ·
hallucination, bias, privacy and cost · a roadmap for what to learn next.

---

## Repository layout

```
sbs-summer-camp/
├── index.html              Course hub — links to every session and quiz
├── assets/                 Shared logo and fonts
├── sessions/
│   ├── session-1/          Published
│   │   ├── presenter.html    ← the deck; open this one
│   │   ├── slide1.html …     32 slides, one file each
│   │   └── assets/           Fonts, images, QR codes
│   ├── session-2/          Placeholder + Colab links
│   ├── session-3/          Placeholder + Colab links
│   └── session-4/          Placeholder + Colab links
├── quizzes/
│   ├── quiz1.html          Live — 5 questions on Session 1
│   ├── quiz2.html          Awaiting questions
│   ├── quiz3.html          Awaiting questions
│   └── quiz4.html          Awaiting questions
└── README.md
```

---

## Presenting a session

Open `sessions/session-<n>/presenter.html` — double-clicking the file works, no server
needed. The deck scales itself to any 16:9 display.

| Key | Action |
|-----|--------|
| `→` `Space` `PgDn` | Next step / slide (works with a clicker) |
| `←` `PgUp` | Previous slide |
| `Home` / `End` | First / last slide |
| `G` | Slide overview grid |
| `N` | Speaker notes |
| `P` | Pen — draw on the slide or whiteboard |
| `F` | Fullscreen |
| `?` | Help |

A few slides have build steps — `→` advances the build first, then moves on.

---

## Editing a quiz

Each quiz is one self-contained file with the questions in a single array at the top.
Open `quizzes/quiz2.html`, find `const QUESTIONS = [`, and fill it in:

```js
const QUESTIONS = [
  {
    q: "Your question text?",
    a: ["First option", "Second option", "Third option", "Fourth option"],
    correct: 1,                       // 0-based index into `a`
    why: "Shown after answering."     // optional
  },
];
```

An empty array renders a "coming soon" page, so the link never 404s. Everything below
that array is the quiz engine — progress bar, grading, score, retry — and doesn't need
touching.

---

## Publishing to GitHub Pages

Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.

Already enabled — the site rebuilds automatically on every push to `main`.

One thing to keep in mind: Pages runs Jekyll, which skips any file or folder whose name
starts with an underscore. Nothing here uses that naming, so pushes publish as-is — just
avoid adding a top-level `_folder` later.

---

## Credits & licensing

- Fonts: **Inter** and **Space Grotesk** (Google Fonts, SIL Open Font License), bundled
  so decks render identically offline.
- Session 1 cold-open portraits are AI-generated (StyleGAN2) — see
  `sessions/session-1/assets/README.txt` for the note on running that activity as scripted.

Course material © SBS Community. Please ask before reusing it outside the camp.
