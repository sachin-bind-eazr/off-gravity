# OFF GRAVITY art assets

**Hard limit:** the only official artwork supplied is the 709x945 campaign poster (`campaign-poster.*`).
Every crop below is derived from it, so effective detail is capped at ~709px wide for the full course.
Pipeline (`node scripts/crops.mjs`): extract -> median(3) denoise (removes JPEG blocks) -> Lanczos3 upscale -> unsharp.
Vectorising was tried (imagetracerjs, two parameter sets) and rejected: it posterised faces/limbs and produced
1-2 MB noisy SVGs, i.e. visibly worse than the raster. Not used.

| file | dims (px) | source box on poster | verdict / max sensible display width |
|---|---|---|---|
| hero-course.webp/.jpg | 2127x1446 | 0,364 - 709,846 | Clean flat art, soft at 1:1 on large screens. Fine up to ~1100 css px on 1x; looks soft on 2x/4K. Needs a >=2800px master for true sharpness. |
| race-climber.webp/.jpg | 720x880 | 0,250 - 180,470 | Source is only 180px wide. Keep display <= ~360 css px. |
| athlete-arch.webp/.jpg | 596x1480 | 560,330 - 709,700 | Source is 149px wide. Keep display <= ~300 css px. |
| slider.webp/.jpg | 760x680 | 150,370 - 340,540 | New. Girl on slide. Display <= ~380 css px. |
| runners.webp/.jpg | 1680x1040 | 200,540 - 620,800 | New. Foreground runners. Display <= ~840 css px. |
| tunnel.webp/.jpg | 956x1160 | 470,350 - 709,640 | New. Arches + runner (overlaps athlete-arch slightly). Display <= ~480 css px. |
| campaign-poster.webp/.jpg | 709x945 | full | Original; display <= ~350 css px. |
| logo.png | 1455x1035 | 190,20 - 675,365 | Stop-gap raster crop. Replace with client vector logo. |

## Needed from client
- Vector (SVG/AI) OFF GRAVITY logo.
- Poster / key art master at >=3000px wide (or layered source) - this is what fixes hero sharpness.
- Real event photography/video stills once available (never present illustrations as event footage).
