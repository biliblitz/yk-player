# yk-player

A modern m3u8 (HLS) player built with Web Components — usable in every project, whatever the framework (or none at all).

Built on [Lit](https://lit.dev/) and [hls.js](https://github.com/video-dev/hls.js).

## Features

- 🎛️ Full controller out of the box — play/pause, seek, volume, speed, fullscreen, auto-hiding controls
- 💬 Subtitles (WebVTT) — switch between subtitle tracks declared in the HLS manifest
- 🎚️ Bitrate switching — pick a quality level manually or let hls.js adapt automatically
- 📺 Native HLS fallback on Safari, where hls.js isn't needed
- 🌏 Built-in i18n (English, 日本語, 中文)
- 📦 Ships as a standard custom element — works with any framework or none

Streaming features like subtitles and adaptive bitrate come straight from [hls.js](https://github.com/video-dev/hls.js) — yk-player provides a clean controller UI on top of them.

## Installation

```sh
npm install @biliblitz/yk-player hls.js lit
```

`hls.js` and `lit` are peer dependencies, so install them alongside the package.

## Quick Start

Import the package once to register the `<yk-player>` custom element, then use it like a regular HTML tag:

```ts
import "@biliblitz/yk-player";
```

```html
<yk-player src="/videos/index.m3u8" autoplay></yk-player>
```

The element fills its container, so give it a size:

```css
yk-player {
  width: 800px;
  aspect-ratio: 16 / 9;
}
```

### Attributes

| Attribute  | Type      | Default | Description                                  |
| ---------- | --------- | ------- | -------------------------------------------- |
| `src`      | `string`  | `""`    | URL of the HLS manifest (`.m3u8`)            |
| `autoplay` | `boolean` | `false` | Start playback automatically                 |
| `lang`     | `string`  | `"en"`  | UI language: `en`, `ja`, or `zh`             |

All attributes are reactive — updating `src` switches the source in place (playback state is preserved), and updating `lang` re-renders the UI in the new language.

### Events

| Event   | Description                        |
| ------- | ---------------------------------- |
| `ended` | Fired when playback reaches the end (bubbles, composed) |

### Usage from JavaScript

```ts
import type { YkPlayer } from "@biliblitz/yk-player";

const player = document.querySelector<YkPlayer>("yk-player")!;
player.src = "/another/index.m3u8";
player.lang = "ja";
player.addEventListener("ended", () => console.log("done"));
```

## Development

```sh
pnpm install
pnpm dev      # start the demo page (index.html) with Vite
pnpm build    # type-check and build the library to dist/
pnpm preview  # preview the production build
```

The demo page at the project root lets you switch between sample sources and UI languages. Place sample HLS streams under `public/` (e.g. `public/pv1.m3u8`).
