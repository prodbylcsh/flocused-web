# flocused-web

The product site for Flocused, a focus timer for macOS that lives in the MacBook notch.

The site works like the app. Its top bar is a menu bar with a **live Flocused notch** in the
middle. It runs a real Pomodoro cycle at 60× speed, opens into the full controls when you point at
it, and announces each new interval with a dot-matrix message. Every section below changes that
same notch: the style you pick, the finish you choose and the intervals you set.

## What's in it

| Section | What it does |
| :--- | :--- |
| Intro | A black screen whose dot-matrix countdown folds into the notch |
| Hero | WebGL folds of light; the glow under the notch follows the current interval's colour |
| Manifesto | Words light up as you scroll |
| Four ways to show time | Pinned MacBook screen that walks through Edge bar, Time and ring, Progress fill and Thin line |
| Controls on demand | A giant, pointer-reactive dot-matrix countdown and the opened notch, life size ×1.5 |
| Five finishes | Classic, Graphite, Soft Matte, Glossy and Liquid Glass (a real backdrop blur) |
| Your rhythm | Presets, steppers and switches that redraw one full cycle to scale |
| Thoughtful details | Bento of the small things: precise clock, every screen, menu bar, privacy |
| Download | Install steps and the Gatekeeper walkthrough |

The notch is a port of the app's own code, not a lookalike:

- `src/lib/geometry.js`: `NotchShape`, `EdgeBarShape` and the notch layouts from `NotchController.swift`
- `src/lib/dotmatrix.js`: the 5×7 dot-matrix font from `DotMatrix.swift`
- `src/lib/timer.js`: the timer engine from `TimerModel.swift`, on a monotonic clock
- `src/components/notch.js`: `NotchView`, morphing between modes with the same spring
- `src/styles/notch.css`: the five finishes from `Surface.swift`

Settings chosen on the site are remembered in the browser, like the app remembers them.

## Develop

Requires Node 20 or later.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

The build goes to `dist/` with relative paths, so it can be hosted anywhere, including a sub-path.

## Deploy

`.github/workflows/deploy-pages.yml` builds the site and publishes it to GitHub Pages on every push
to `main`. To turn it on, open **Settings → Pages** in this repository and set **Source** to
**GitHub Actions**.

## Stack

[Vite](https://vite.dev), plain JavaScript, [GSAP](https://gsap.com) with ScrollTrigger,
[Lenis](https://lenis.darkroom.engineering) for smooth scrolling, and self-hosted Instrument Serif,
Geist and Geist Mono. The site respects `prefers-reduced-motion`.

## Support Flocused

If Flocused has brought value to your work and your focus, you can say thanks and help fund
its continued development with a donation:

<p>
<a href="https://github.com/sponsors/prodbylcsh"><img src="https://img.shields.io/badge/GitHub_Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub"></a>
<a href="https://www.patreon.com/LueCash"><img src="https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white" alt="Support on Patreon"></a>
<a href="https://ko-fi.com/luecash"><img src="https://img.shields.io/badge/Ko--fi-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white" alt="Support on Ko-fi"></a>
<a href="https://buymeacoffee.com/luecash"><img src="https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black" alt="Buy Me a Coffee"></a>
</p>
