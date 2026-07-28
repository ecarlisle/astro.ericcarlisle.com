// @ts-nocheck — dynamically imported player initializer types
// cannot be statically traced through private class fields.

/**
 * <youtube-facade> custom element.
 *
 * Displays a poster and play button before activation. After activation,
 * dynamically imports the player initializer and mounts the iframe.
 * No YouTube requests occur before activation.
 */
class YouTubeFacadeElement extends HTMLElement {
  static #defined = false;

  #videoId = '';
  #start = -1;
  #activated = false;

  /** @type {HTMLElement | null} */
  #container = null;
  /** @type {HTMLElement | null} */
  #status = null;

  constructor() {
    super();
    if (!YouTubeFacadeElement.#defined) {
      YouTubeFacadeElement.#defined = true;
    }
  }

  connectedCallback() {
    this.#videoId = this.getAttribute('data-video-id') || '';
    const startAttr = this.getAttribute('data-start');
    this.#start = startAttr ? parseInt(startAttr, 10) : -1;

    this.#container = this.querySelector('.yf-container');
    this.#status = this.querySelector('.yf-status');

    const playBtn = this.querySelector('.yf-play');
    playBtn?.addEventListener('click', () => this.#activate(), { once: true });
  }

  disconnectedCallback() {
    // If the dynamic import is in flight, prevent mounting into a detached node.
    this.#activated = true;
  }

  /** @param {string} msg @param {string} [type] */
  #setStatus(msg, type) {
    if (!this.#status) return;
    this.#status.textContent = msg;
    this.#status.className = 'yf-status';
    if (type) this.#status.classList.add(`yf-status--${type}`);
  }

  async #activate() {
    if (this.#activated || !this.#container) return;
    this.#activated = true;
    this.#setStatus('Loading player\u2026', 'loading');

    try {
      // Check container is still connected
      if (!this.isConnected) return;

      const { mountYouTubePlayer } = await import('./youtube-player');

      // Double-check after async import
      if (!this.isConnected || !this.#container) return;

      mountYouTubePlayer({
        container: this.#container,
        videoId: this.#videoId,
        title: this.getAttribute('data-title') || 'YouTube video',
        start: this.#start >= 0 ? this.#start : undefined,
      });

      this.#setStatus('', '');
    } catch (err) {
      console.error('YouTube facade error:', err);
      this.#setStatus('Could not load video.', 'error');
    }
  }
}

customElements.define('youtube-facade', YouTubeFacadeElement);
