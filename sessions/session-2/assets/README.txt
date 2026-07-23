SBS · Generative AI — Session 2 · assets
=========================================

sbs-logo.png            SBS Community logo.
moaz.jpg                Portrait for the "who's talking to you" slide.

hf-logo.svg             Hugging Face logo (mark only).
hf-logo-with-title.svg  Hugging Face logo with wordmark — used on slide 23.
Google_Colaboratory_SVG_Logo.svg
                        Google Colab logo — used on the notebook hand-off slide
                        and on the guided-project homework slide.

qr-website.png          -> https://moazeldegwy.com
qr-linkedin.png         -> https://www.linkedin.com/in/moaz-eldegwy/
qr-colab.png            -> the Session 2 Colab notebook  (slide 27)
qr-project.png          -> the guided-project Colab notebook — homework,
                           task 2  (slide 30)
qr-transformer.png      -> https://poloclub.github.io/transformer-explainer/
                           (spare — slide 30 now carries the project QR instead)
qr-huggingface.png      -> https://huggingface.co   (spare — not currently placed)

                        Regenerate any QR with:
                          python -m pip install "qrcode[pil]"
                          python -c "import qrcode;qrcode.make('URL').save('out.png')"

bpe-cl100k.js           THE REAL cl100k_base BPE vocabulary (100,256 entries),
                        exported from tiktoken — this is the tokenizer behind
                        GPT-3.5 and GPT-4. Bundled so the tokenizer slide gives
                        GENUINE token IDs for anything the room types, with no
                        network at all. Verified against tiktoken:
                          "strawberry"         -> [496, 675, 15717]   str|aw|berry
                          "I love programming" -> [40, 3021, 15840]
                        Written as pure-ASCII JSON on purpose: python's
                        http.server serves .js without a charset, and any
                        non-ASCII would arrive mangled as Latin-1.

gemini-key.js           Local Gemini API key for the live temperature slide.
                        GITIGNORED — never commit it. If it ever lands on
                        GitHub, rotate it in AI Studio.

Inter-var.woff2         Inter variable font (latin) — Google Fonts, OFL
SpaceGrotesk-var.woff2  Space Grotesk variable font (latin) — Google Fonts, OFL
                        Bundled so the deck renders identically offline.


Presenting
----------
Run present.bat from the repo root — it serves the deck over http://localhost
and opens Session 2. The live Gemini slide needs http, NOT file://.

Keys: -> / Space / PgDn next · <- / PgUp back · G overview · N speaker notes
      F fullscreen · P pen · E eraser · L laser · W whiteboard · ? help

Slides with build steps (-> advances the build first, then the slide):
  7  THE MAP            5 steps — builds the assembly line station by station
  11 Meaning map        1 step  — draws the king->queen / man->woman arrows
  12 Ball/box game      2 steps — the answer, then the one-word twist
  13 Transformer        2 steps — reveals both "bank" meanings, then the arrow

(Slide 4 is the scoring board — 200 marks, 160 to pass. Every slide number
 after it shifted by +1 when that slide was added.)


Design system (matches Session 1 exactly)
-----------------------------------------
Frame        every slide is a FIXED 1280x720 box; nothing may overflow it.
Colours      --primary #FF6B6B  --accent #4ECDC4  --ink #1D2530  --muted #5F6C7B
Type         kicker  600 14px, .22em, uppercase, muted
             title   700 40-46px Space Grotesk, -1px
             section 600 11.5px, .16em, uppercase, faint
             body    400 15px/1.55 Inter, muted
Cards        #fff, 1px --line, radius 22px, shared --shadow
Icons        inline SVG only — 24x24 viewBox, fill:none, stroke:currentColor,
             stroke-width 2, round caps/joins. NO emoji in slide content.
