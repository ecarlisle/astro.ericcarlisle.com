/**
 * youtube-player — dynamically imported YouTube iframe initializer.
 *
 * Mounts a youtube-nocookie.com iframe into a provided container element.
 * Small, focused module — not the YouTube Player API.
 */

export interface MountOptions {
  container: HTMLElement;
  videoId: string;
  title: string;
  start?: number;
}

export interface MountResult {
  iframe: HTMLIFrameElement;
}

/**
 * Create and mount a YouTube Privacy Enhanced Mode iframe.
 * Must only be called after explicit user activation.
 */
export function mountYouTubePlayer({
  container,
  videoId,
  title,
  start,
}: MountOptions): MountResult {
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
  });
  if (typeof start === 'number' && start >= 0) {
    params.set('start', String(start));
  }

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
  iframe.title = title;
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.allow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.setAttribute('loading', 'lazy');

  // Clear container and mount
  container.replaceChildren(iframe);

  return { iframe };
}
