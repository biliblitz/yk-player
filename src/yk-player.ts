import Hls from "hls.js";
import type { Level, MediaPlaylist } from "hls.js";
import { LitElement, unsafeCSS, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { translate, type YkPlayerStrings } from "./i18n.ts";
import { formatDuration, percent, qualityLabel } from "./utils.ts";

import playerStyle from "./yk-player.css?raw";

const PLAY_PATH = "M8 5v14l11-7z";
const PAUSE_PATH = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";
const SUBTITLE_PATH =
  "M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z";
// hollow rounded-rect ring (outer rect + inset rect wound the opposite way) with the same solid CC glyphs floating inside
const SUBTITLE_OUTLINE_PATH =
  "M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5 6h14v12H5z" +
  "M11 11H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z" +
  "M18 11h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z";
const QUALITY_PATH =
  "M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.61l-1.92-3.32a.5.5 0 0 0-.59-.22l-2.39.96a7.3 7.3 0 0 0-1.62-.94L14.4 2.81a.5.5 0 0 0-.48-.41h-3.84a.5.5 0 0 0-.47.41L9.25 5.35c-.59.24-1.13.56-1.62.94L5.24 5.33a.5.5 0 0 0-.59.22L2.74 8.87a.5.5 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.5.5 0 0 0-.12.61l1.92 3.32a.5.5 0 0 0 .59.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54a.5.5 0 0 0 .48.41h3.84a.5.5 0 0 0 .47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96a.5.5 0 0 0 .59-.22l1.92-3.32a.5.5 0 0 0-.12-.61l-2.03-1.58ZM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Z";
const VOLUME_UP_PATH =
  "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z";
const VOLUME_DOWN_PATH =
  "M5 9v6h4l5 5V4L9 9H5zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02z";
const VOLUME_OFF_PATH =
  "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.8L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z";
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
// standard HTMLMediaElement events re-dispatched on the host so <yk-player>
// can be listened to like a plain <video>
const MEDIA_EVENTS = [
  "abort",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "ended",
  "error",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
] as const;
const CHEVRON_LEFT_PATH = "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z";
const CHEVRON_RIGHT_PATH = "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z";
const FULLSCREEN_EXIT_PATH =
  "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z";
const FULLSCREEN_ENTER_PATH =
  "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z";

@customElement("yk-player")
export class YkPlayer extends LitElement {
  @property({ type: String })
  src = "";

  @property({ type: Boolean })
  autoplay = false;

  @property({ type: String, reflect: true })
  lang = "en";

  @query("video")
  private videoEl!: HTMLVideoElement;

  @query(".settings-menu-wrap")
  private settingsMenuWrapEl?: HTMLElement;

  @state()
  private playing = false;

  @state()
  private _currentTime = 0;

  @state()
  private _duration = Infinity;

  @state()
  private fullscreen = false;

  @state()
  private active = true;

  @state()
  private ping: { icon: "play" | "pause"; token: number } | null = null;

  @state()
  private subtitleTracks: MediaPlaylist[] = [];

  @state()
  private activeSubtitleId = -1;

  @state()
  private levels: Level[] = [];

  @state()
  private currentLevel = -1;

  @state()
  private activeLevel = -1;

  @state()
  private _volume = 1;

  @state()
  private _muted = false;

  @state()
  private showRemaining = false;

  @state()
  private settingsMenuOpen = false;

  @state()
  private settingsPanel: "root" | "speed" | "quality" | "subtitle" = "root";

  @state()
  private _playbackRate = 1;

  @state()
  private error: string | null = null;

  @state()
  private actionMessage: string | null = null;

  @state()
  private actionMessageVisible = false;

  private hls: Hls | null = null;
  private ctrl = new AbortController();
  private inside = false;
  private hoveringControls = false;
  private movement = 0;
  private pingToken = 0;
  private lastSubtitleId = -1;
  private suppressNextPlayPing = false;
  private actionMessageTimer: ReturnType<typeof setTimeout> | null = null;

  // HTMLMediaElement-like API — before the first render the inner <video>
  // doesn't exist yet, so reads fall back to the internal state and writes
  // are staged there, then applied to the <video> in firstUpdated()

  get currentTime(): number {
    return this.hasUpdated ? this.videoEl.currentTime : this._currentTime;
  }

  set currentTime(value: number) {
    if (this.hasUpdated) this.videoEl.currentTime = value;
    else this._currentTime = value;
  }

  get duration(): number {
    return this.hasUpdated ? this.videoEl.duration : this._duration;
  }

  get paused(): boolean {
    return this.hasUpdated ? this.videoEl.paused : true;
  }

  get ended(): boolean {
    return this.hasUpdated ? this.videoEl.ended : false;
  }

  get volume(): number {
    return this.hasUpdated ? this.videoEl.volume : this._volume;
  }

  set volume(value: number) {
    if (this.hasUpdated) this.videoEl.volume = value;
    else this._volume = value;
  }

  get muted(): boolean {
    return this.hasUpdated ? this.videoEl.muted : this._muted;
  }

  set muted(value: boolean) {
    if (this.hasUpdated) this.videoEl.muted = value;
    else this._muted = value;
  }

  get playbackRate(): number {
    return this.hasUpdated ? this.videoEl.playbackRate : this._playbackRate;
  }

  set playbackRate(value: number) {
    if (this.hasUpdated) this.videoEl.playbackRate = value;
    else this._playbackRate = value;
  }

  play(): Promise<void> {
    if (!this.hasUpdated) {
      return this.updateComplete.then(() => this.videoEl.play());
    }
    return this.videoEl.play();
  }

  pause() {
    if (this.hasUpdated) this.videoEl.pause();
  }

  private t(key: keyof YkPlayerStrings) {
    return translate(this.lang, key);
  }

  private icon(path: string, className?: string) {
    return html`<svg viewBox="0 0 24 24" class=${className ?? nothing}>
      <path d=${path} />
    </svg>`;
  }

  // Buttons are mouse-activated without keeping keyboard focus, so a
  // Space press right after clicking (e.g. fullscreen) toggles playback
  // instead of re-activating the last-clicked button.
  private preventFocus(e: MouseEvent) {
    e.preventDefault();
  }

  private levelsByQuality() {
    return this.levels
      .map((level, index) => ({ level, index }))
      .sort(
        (a, b) =>
          (b.level.height ?? b.level.bitrate ?? 0) -
          (a.level.height ?? a.level.bitrate ?? 0),
      );
  }

  render() {
    return html`
      <video ?autoplay=${this.autoplay} playsinline></video>

      <div
        class="background"
        @click=${this.onBackgroundClick}
        @dblclick=${this.toggleFullscreen}
      ></div>

      ${this.error
        ? html`<div class="error">${this.error}</div>`
        : ""}

      <div
        class="action-message ${this.actionMessageVisible ? "visible" : ""}"
      >
        ${this.actionMessage}
      </div>

      ${this.ping
        ? keyed(
            this.ping.token,
            html`
              <div class="ping" @animationend=${() => (this.ping = null)}>
                ${this.icon(this.ping.icon === "play" ? PLAY_PATH : PAUSE_PATH)}
              </div>
            `,
          )
        : ""}

      <div
        class="controls ${this.active ? "active" : ""}"
        @mouseenter=${this.onControlsEnter}
        @mouseleave=${this.onControlsLeave}
      >
        <div
          class="seekbar"
          @click=${this.seek}
          @mousemove=${this.onSeekbarHover}
          @mouseleave=${this.onSeekbarLeave}
        >
          <div class="track">
            <div
              class="progress"
              style="width: ${percent(this._currentTime, this._duration)}%"
            ></div>
          </div>
        </div>
        <div class="row">
          <div class="group">
            <button
              class="group-wrapper"
              @mousedown=${this.preventFocus}
              @click=${this.togglePlay}
            >
              ${this.icon(this.playing ? PAUSE_PATH : PLAY_PATH)}
            </button>
          </div>
          <div class="group">
            <div class="volume-wrap group-wrapper">
              <button @mousedown=${this.preventFocus} @click=${this.toggleMute}>
                ${this.icon(this.volumeIconPath())}
              </button>
              <input
                class="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                style="--volume: ${percent(this._muted ? 0 : this._volume, 1)}%"
                .value=${String(this._muted ? 0 : this._volume)}
                @input=${this.onVolumeInput}
              />
            </div>
          </div>
          <div class="group">
            <span class="time group-wrapper" @click=${this.toggleTimeMode}>
              ${this.showRemaining
                ? `-${formatDuration(this._duration - this._currentTime)}`
                : formatDuration(this._currentTime)}
              / ${formatDuration(this._duration)}
            </span>
          </div>
          <span class="spacer"></span>
          <div class="group">
            <button
              class="group-wrapper ${this.subtitleTracks.length === 0
                ? "dim"
                : ""}"
              @mousedown=${this.preventFocus}
              @click=${this.toggleSubtitle}
            >
              ${this.icon(
                this.activeSubtitleId === -1
                  ? SUBTITLE_OUTLINE_PATH
                  : SUBTITLE_PATH,
              )}
            </button>
            <div class="settings-menu-wrap">
              ${this.settingsMenuOpen
                ? html`
                    <div class="menu">
                      ${this.settingsPanel === "root"
                        ? html`
                            ${this.subtitleTracks.length > 0
                              ? html`
                                  <div
                                    class="menu-item nav"
                                    @click=${() =>
                                      (this.settingsPanel = "subtitle")}
                                  >
                                    <span>${this.t("subtitles")}</span>
                                    <span class="hint">
                                      ${this.subtitleLabel()}
                                      ${this.icon(
                                        CHEVRON_RIGHT_PATH,
                                        "chevron",
                                      )}
                                    </span>
                                  </div>
                                `
                              : ""}
                            <div
                              class="menu-item nav"
                              @click=${() => (this.settingsPanel = "speed")}
                            >
                              <span>${this.t("speed")}</span>
                              <span class="hint">
                                ${this._playbackRate}x
                                ${this.icon(CHEVRON_RIGHT_PATH, "chevron")}
                              </span>
                            </div>
                            <div
                              class="menu-item nav"
                              @click=${() => (this.settingsPanel = "quality")}
                            >
                              <span>${this.t("bitrate")}</span>
                              <span class="hint">
                                ${this.currentLevel === -1
                                  ? this.t("auto")
                                  : qualityLabel(
                                      this.levels[this.currentLevel],
                                      this.t("auto"),
                                    )}
                                ${this.icon(CHEVRON_RIGHT_PATH, "chevron")}
                              </span>
                            </div>
                          `
                        : ""}
                      ${this.settingsPanel === "speed"
                        ? html`
                            <div
                              class="menu-header"
                              @click=${() => (this.settingsPanel = "root")}
                            >
                              ${this.icon(CHEVRON_LEFT_PATH, "chevron")}
                              ${this.t("speed")}
                            </div>
                            ${SPEEDS.map(
                              (rate) => html`
                                <div
                                  class="menu-item ${this._playbackRate === rate
                                    ? "selected"
                                    : ""}"
                                  @click=${() => this.selectSpeed(rate)}
                                >
                                  ${rate}x
                                </div>
                              `,
                            )}
                          `
                        : ""}
                      ${this.settingsPanel === "quality"
                        ? html`
                            <div
                              class="menu-header"
                              @click=${() => (this.settingsPanel = "root")}
                            >
                              ${this.icon(CHEVRON_LEFT_PATH, "chevron")}
                              ${this.t("bitrate")}
                            </div>
                            <div
                              class="menu-item ${this.currentLevel === -1
                                ? "selected"
                                : ""}"
                              @click=${() => this.selectQuality(-1)}
                            >
                              ${this.t("auto")}${this.currentLevel === -1 &&
                              this.activeLevel !== -1
                                ? html`<span class="hint">
                                    (${qualityLabel(
                                      this.levels[this.activeLevel],
                                      this.t("auto"),
                                    )})</span
                                  >`
                                : ""}
                            </div>
                            ${this.levelsByQuality().map(
                              ({ level, index }) => html`
                                <div
                                  class="menu-item ${this.currentLevel ===
                                  index
                                    ? "selected"
                                    : ""}"
                                  @click=${() => this.selectQuality(index)}
                                >
                                  ${qualityLabel(level, this.t("auto"))}
                                </div>
                              `,
                            )}
                          `
                        : ""}
                      ${this.settingsPanel === "subtitle"
                        ? html`
                            <div
                              class="menu-header"
                              @click=${() => (this.settingsPanel = "root")}
                            >
                              ${this.icon(CHEVRON_LEFT_PATH, "chevron")}
                              ${this.t("subtitles")}
                            </div>
                            <div
                              class="menu-item ${this.activeSubtitleId === -1
                                ? "selected"
                                : ""}"
                              @click=${() => this.selectSubtitle(-1)}
                            >
                              ${this.t("off")}
                            </div>
                            ${this.subtitleTracks.map(
                              (t) => html`
                                <div
                                  class="menu-item ${this.activeSubtitleId ===
                                  t.id
                                    ? "selected"
                                    : ""}"
                                  @click=${() => this.selectSubtitle(t.id)}
                                >
                                  ${t.name || t.lang || this.t("subtitle")}
                                </div>
                              `,
                            )}
                          `
                        : ""}
                    </div>
                  `
                : ""}
              <button
                class="group-wrapper"
                @mousedown=${this.preventFocus}
                @click=${this.toggleSettingsMenu}
              >
                ${this.icon(QUALITY_PATH)}
              </button>
            </div>
            <button
              class="group-wrapper"
              @mousedown=${this.preventFocus}
              @click=${this.toggleFullscreen}
            >
              ${this.icon(
                this.fullscreen ? FULLSCREEN_EXIT_PATH : FULLSCREEN_ENTER_PATH,
              )}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    // focusable so the player receives keyboard shortcuts after being clicked
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
  }

  firstUpdated() {
    const { signal } = this.ctrl;
    this.suppressNextPlayPing = this.autoplay;

    // apply property values staged before the <video> existed
    this.videoEl.volume = this._volume;
    this.videoEl.muted = this._muted;
    this.videoEl.playbackRate = this._playbackRate;
    if (this._currentTime > 0) this.videoEl.currentTime = this._currentTime;

    for (const type of MEDIA_EVENTS) {
      this.videoEl.addEventListener(
        type,
        () => this.dispatchEvent(new Event(type)),
        { signal },
      );
    }

    this.videoEl.addEventListener(
      "play",
      () => {
        this.playing = true;
        if (this.suppressNextPlayPing) {
          this.suppressNextPlayPing = false;
        } else {
          this.showPing("play");
        }
      },
      { signal },
    );
    this.videoEl.addEventListener(
      "pause",
      () => {
        this.playing = false;
        if (!this.videoEl.ended) this.showPing("pause");
      },
      { signal },
    );
    this.videoEl.addEventListener(
      "timeupdate",
      () => (this._currentTime = this.videoEl.currentTime),
      { signal },
    );
    this.videoEl.addEventListener(
      "durationchange",
      () => (this._duration = this.videoEl.duration),
      { signal },
    );
    this.videoEl.addEventListener(
      "volumechange",
      () => {
        this._volume = this.videoEl.volume;
        this._muted = this.videoEl.muted;
      },
      { signal },
    );
    this.videoEl.addEventListener(
      "ratechange",
      () => (this._playbackRate = this.videoEl.playbackRate),
      { signal },
    );
    this.videoEl.addEventListener(
      "error",
      () => {
        // only the native <video> error path (used for Safari/native HLS); hls.js failures are reported via Hls.Events.ERROR instead
        if (!this.hls) this.error = this.t("loadError");
      },
      { signal },
    );
    this.videoEl.addEventListener(
      "loadeddata",
      () => (this.error = null),
      { signal },
    );
    document.addEventListener(
      "fullscreenchange",
      () => (this.fullscreen = document.fullscreenElement === this),
      { signal },
    );

    this.addEventListener("keydown", (e) => this.onKeydown(e), { signal });
    this.addEventListener("mousemove", () => this.onMousemove(), { signal });
    this.addEventListener("mouseenter", () => (this.inside = true), { signal });
    this.addEventListener(
      "mouseleave",
      () => {
        this.inside = false;
        this.active = false;
      },
      { signal },
    );
    document.addEventListener(
      "click",
      (e) => {
        if (
          this.settingsMenuOpen &&
          !e.composedPath().includes(this.settingsMenuWrapEl!)
        ) {
          this.settingsMenuOpen = false;
          this.settingsPanel = "root";
        }
      },
      { signal },
    );
  }

  private toggleSubtitle() {
    if (this.subtitleTracks.length === 0) return;
    if (this.activeSubtitleId === -1) {
      const fallback = this.subtitleTracks[0].id;
      this.selectSubtitle(
        this.lastSubtitleId !== -1 ? this.lastSubtitleId : fallback,
      );
    } else {
      this.lastSubtitleId = this.activeSubtitleId;
      this.selectSubtitle(-1);
    }
  }

  private selectSubtitle(id: number) {
    if (this.hls) this.hls.subtitleTrack = id;
    this.settingsMenuOpen = false;
    const track = this.subtitleTracks.find((t) => t.id === id);
    const label =
      id === -1 ? this.t("off") : track?.name || track?.lang || this.t("subtitle");
    this.showAction(`${this.t("subtitles")}: ${label}`);
  }

  private subtitleLabel() {
    if (this.activeSubtitleId === -1) return this.t("off");
    const track = this.subtitleTracks.find(
      (t) => t.id === this.activeSubtitleId,
    );
    return track?.name || track?.lang || this.t("subtitle");
  }

  private toggleSettingsMenu() {
    this.settingsMenuOpen = !this.settingsMenuOpen;
    this.settingsPanel = "root";
  }

  private selectQuality(id: number) {
    if (this.hls) this.hls.currentLevel = id;
    this.currentLevel = id;
    this.settingsMenuOpen = false;
  }

  private selectSpeed(rate: number) {
    // _playbackRate is synced by the ratechange listener
    this.videoEl.playbackRate = rate;
    this.settingsMenuOpen = false;
  }

  private toggleTimeMode() {
    this.showRemaining = !this.showRemaining;
  }

  private toggleMute() {
    this.videoEl.muted = !this.videoEl.muted;
    this.showAction(
      this.videoEl.muted
        ? this.t("muted")
        : `${Math.round(this.videoEl.volume * 100)}%`,
    );
  }

  private onVolumeInput(e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    this.videoEl.volume = value;
    this.videoEl.muted = value === 0;
    this.showAction(value === 0 ? this.t("muted") : `${Math.round(value * 100)}%`);
  }

  private volumeIconPath() {
    if (this._muted || this._volume === 0) return VOLUME_OFF_PATH;
    if (this._volume < 0.5) return VOLUME_DOWN_PATH;
    return VOLUME_UP_PATH;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("src")) {
      // deferred so loadSource()'s state resets land after this update cycle
      // settles, instead of re-arming it and scheduling another one synchronously
      // (see https://lit.dev/msg/change-in-update)
      queueMicrotask(() => this.loadSource());
    }
    if (changed.has("fullscreen") || changed.has("active")) {
      this.classList.toggle("hide-cursor", this.fullscreen && !this.active);
    }
  }

  private onMousemove() {
    const token = ++this.movement;
    this.active = true;
    setTimeout(() => {
      if (this.inside && token === this.movement && !this.hoveringControls) {
        this.active = false;
      }
    }, 2000);
  }

  private onControlsEnter() {
    this.hoveringControls = true;
  }

  private onControlsLeave() {
    this.hoveringControls = false;
    this.onMousemove();
  }

  private showPing(icon: "play" | "pause") {
    this.ping = { icon, token: ++this.pingToken };
  }

  private togglePlay() {
    if (this.videoEl.paused) this.videoEl.play();
    else this.videoEl.pause();
  }

  private onKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // buttons keep native Space activation; everything else (including the
    // focused volume slider) goes through the player-wide shortcuts
    const onButton = e.composedPath()[0] instanceof HTMLButtonElement;

    switch (e.key) {
      case " ":
        if (onButton) return;
        this.togglePlay();
        break;
      case "k":
        this.togglePlay();
        break;
      case "f":
        this.toggleFullscreen();
        break;
      case "m":
        this.toggleMute();
        break;
      case "c":
        this.toggleSubtitle();
        break;
      case "ArrowLeft":
        this.seekBy(-5);
        break;
      case "ArrowRight":
        this.seekBy(5);
        break;
      case "j":
        this.seekBy(-10);
        break;
      case "l":
        this.seekBy(10);
        break;
      case "ArrowUp":
        this.changeVolume(0.1);
        break;
      case "ArrowDown":
        this.changeVolume(-0.1);
        break;
      case "Escape":
        if (!this.settingsMenuOpen) return;
        this.settingsMenuOpen = false;
        this.settingsPanel = "root";
        break;
      default:
        if (e.key >= "0" && e.key <= "9" && isFinite(this._duration)) {
          this.videoEl.currentTime = (Number(e.key) / 10) * this._duration;
          break;
        }
        return;
    }
    e.preventDefault();
  }

  private seekBy(delta: number) {
    if (!isFinite(this._duration)) return;
    const time = Math.max(
      0,
      Math.min(this._duration, this.videoEl.currentTime + delta),
    );
    this.videoEl.currentTime = time;
    this.showAction(formatDuration(time));
  }

  private changeVolume(delta: number) {
    const volume = Math.max(0, Math.min(1, this.videoEl.volume + delta));
    this.videoEl.volume = volume;
    this.videoEl.muted = volume === 0;
    this.showAction(
      volume === 0 ? this.t("muted") : `${Math.round(volume * 100)}%`,
    );
  }

  private onBackgroundClick() {
    // clicking the video surface while the menu is open only dismisses it
    if (this.settingsMenuOpen) {
      this.settingsMenuOpen = false;
      this.settingsPanel = "root";
      return;
    }
    this.togglePlay();
  }

  private toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else this.requestFullscreen();
  }

  private seek(e: MouseEvent) {
    if (!isFinite(this._duration)) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    this.videoEl.currentTime = ratio * this._duration;
  }

  private onSeekbarHover(e: MouseEvent) {
    if (!isFinite(this._duration)) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    this.clearActionTimer();
    this.actionMessage = formatDuration(ratio * this._duration);
    this.actionMessageVisible = true;
  }

  private onSeekbarLeave() {
    this.clearActionTimer();
    this.actionMessageVisible = false;
  }

  private clearActionTimer() {
    if (this.actionMessageTimer) {
      clearTimeout(this.actionMessageTimer);
      this.actionMessageTimer = null;
    }
  }

  private showAction(text: string, timeout = 1500) {
    this.clearActionTimer();
    this.actionMessage = text;
    this.actionMessageVisible = true;
    this.actionMessageTimer = setTimeout(() => {
      this.actionMessageVisible = false;
      this.actionMessageTimer = null;
    }, timeout);
  }

  private loadSource() {
    if (!this.src) return;

    if (Hls.isSupported()) {
      if (!this.hls) {
        this.hls = new Hls();
        this.hls.attachMedia(this.videoEl);
        this.hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
          this.subtitleTracks = this.hls?.subtitleTracks ?? [];
        });
        this.hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_event, data) => {
          this.activeSubtitleId = data.id;
        });
        this.hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          this.levels = data.levels;
          this.currentLevel = this.hls?.currentLevel ?? -1;
        });
        this.hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          this.activeLevel = data.level;
        });
        this.hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            this.error = this.t("loadError");
            // the inner <video> only fires "error" on the native HLS path,
            // so surface fatal hls.js failures the same way
            this.dispatchEvent(new Event("error"));
          }
        });
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => (this.error = null));
      }

      // clear stale menus from the previous source; fresh events repopulate them once the new manifest parses
      this.subtitleTracks = [];
      this.activeSubtitleId = -1;
      this.lastSubtitleId = -1;
      this.levels = [];
      this.currentLevel = -1;
      this.activeLevel = -1;
      this.settingsMenuOpen = false;
      this.settingsPanel = "root";
      this.error = null;

      // keep playing across source switches so it doesn't flash to black
      const wasPlaying = !this.videoEl.paused;
      this.hls.once(Hls.Events.MANIFEST_PARSED, () => {
        if (wasPlaying) this.videoEl.play().catch(() => {});
      });
      this.hls.loadSource(this.src);
    } else if (this.videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      // native HLS playback (e.g. Safari), no hls.js/MSE involved
      this.hls?.destroy();
      this.hls = null;
      this.subtitleTracks = [];
      this.activeSubtitleId = -1;
      this.lastSubtitleId = -1;
      this.levels = [];
      this.currentLevel = -1;
      this.activeLevel = -1;
      this.error = null;
      this.videoEl.src = this.src;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.ctrl.abort();
    this.hls?.destroy();
    this.hls = null;
    this.clearActionTimer();
  }

  static styles = [unsafeCSS(playerStyle)];
}

declare global {
  interface HTMLElementTagNameMap {
    "yk-player": YkPlayer;
  }
}
