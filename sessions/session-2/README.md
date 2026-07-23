# Session 2 — Under the Hood + Run One Yourself

**Thu 23 Jul 2026 · 7:00 PM · SBS Community**

The whole machine, box by box: **tokenizer → embeddings → transformer → LM head →
a ranked list of guesses**. Then temperature, then where the billions of learned
numbers come from (pretraining) — and finally you load and run a real pretrained
model yourself.

## Open the deck

```
sessions/session-2/presenter.html
```

Run `present.bat` from the repo root — it serves over `http://localhost` and opens
this session. **The live Gemini slide needs http, not `file://`.**

Published at:

```
https://moaz-eldegwy.github.io/SBS-Summer-Camp/sessions/session-2/presenter.html
```

## Deck at a glance — 32 slides

| # | Part | Slides |
|---|------|--------|
| 1–3 | Front matter | title · about · roadmap |
| 4 | Front matter | **scoring board** — 200 marks, 160 to pass |
| 5 | Front matter | how tonight runs + 30-sec recap |
| 6–7 | Open the black box | the question · **THE MAP** (hero, 5 build steps) |
| 8–9 | Station 1 · Tokens | chunks not letters · **live tokenizer** |
| 10–11 | Station 2 · Embeddings | **real GPT-2 vectors** · the meaning map |
| 12–13 | Station 3 · Transformer | **ball/box game** (asked first) · attention in context |
| 14–15 | Station 4 · LM head | the ranked list · **prediction + temperature dial** |
| 16–17 | Sampling | the creativity dial · **live Gemini, 0.0 vs 1.3** |
| 18 | Bridge | **the pipeline dissolves into numbers** → "parameter" |
| 19–21 | Pretraining | random dials · fill-in-the-blank loop · base vs. assistant |
| 22 | Recap | **the machine, whole** — the payoff; closes the explaining |
| 23–25 | Run one yourself | Hugging Face · four lines of Python · the plan for the practical |
| 26 | Weaknesses | three things you're about to break — the pre-flight briefing |
| 27 | Hands-on | open the notebook |
| 28–32 | Wrap | what you know · session 3 · **guided project (task 2)** · sources · thanks |

`THE MAP` (slide 7) is the spine of the deck and reappears as a progress strip on
every station slide with the current box lit.

**One sentence runs through the whole deck.** `"The sky is"` is introduced on slide 5,
drawn as the input on slide 7, tokenized for real on slide 9 (`791 · 13180 · 374`),
embedded for real on slide 10, and predicted on slides 14–15. Keep those consistent
if you edit any one of them.

**The question comes before the answer.** The ball/box puzzle (slide 12) is deliberately
placed *before* the transformer explanation (slide 13) — the room solves it first,
then you name what they just did. Don't say "attention" on slide 12.

**The recap closes the explaining; the weaknesses open the practical.** Slide 22 is the
payoff of the whole first half — everything after it is the room *doing* rather than
listening. Slide 26 (weaknesses) sits deliberately last, right before the notebook, so
"you can predict how it will fail" runs straight into "go make it fail."

**The marking is stated up front.** Slide 4 is the scoring board — quizzes and attendance
(10 each, every session), tasks 2/3/4 (35 · 35 · 50), 200 total, 160 to pass. Task 1 is a
+8 bonus and participation is 0–10 per session. It sits right after the roadmap so the
room knows what tonight is worth before anything else starts.

## The four interactive widgets

1. **Tokenizer** (slide 9) — a **real cl100k BPE tokenizer** bundled offline, so any
   sentence the room types gets genuine token IDs. Verified against `tiktoken`.
   Preloaded: `strawberry` (→ `str|aw|berry`, which is *why* it miscounts the R's),
   an English sentence, and Arabic (25 tokens vs 3 — the cost-in-Arabic point).
2. **Meaning map** (slide 11) — 19 hardcoded words in clean clusters; `→` draws the
   parallel `king→queen` / `man→woman` arrows.
3. **Prediction + temperature** (slide 15) — 4 canned prompts, and a slider that
   genuinely re-shapes the distribution (`p^(1/T)`). No network.
4. **Gemini side-by-side** (slide 17) — same prompt at temperature 0.2 and 1.3.
   Needs `assets/gemini-key.js` + http. Falls back to a saved pair with a small
   badge if the call fails, so the slide never dies live.

## Notebooks

Code for this session runs in Google Colab — no local setup needed.

| # | Notebook | Colab |
|---|----------|-------|
| 1 | Run your first model — the in-session hands-on (slide 27) | [open](https://colab.research.google.com/drive/11eHvAZKxcTYgi1B1gjBgCRJQh1DgeehX?usp=sharing) |
| 2 | Guided project — homework, **task 2 · 35 marks** (slide 30) | [open](https://colab.research.google.com/drive/16aT12yD1UdvEqiT6X8ih7kVc8LTlJAaf?usp=sharing) |

## Quiz

[Quiz 2](../../quizzes/quiz2.html) — opens after the session.
