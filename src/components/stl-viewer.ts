// @ts-nocheck — dynamic import('three') cannot be statically typed
// through private class field declarations.
// Three.js types are validated at runtime through activation.

/**
 * <stl-viewer> custom element.
 *
 * Three.js, STLLoader, and OrbitControls are dynamically imported only
 * after user activation. TypeScript checking is disabled for this file
 * via the @ts-nocheck directive because dynamic import('three') calls
 * cannot be statically typed through private class field declarations.
 */
class StlViewerElement extends HTMLElement {
  static #defined = false;

  #src = '';
  #color = '#d97757';
  #background = null;
  #activated = false;

  /** @type {HTMLElement | null} */
  #status = null;
  /** @type {HTMLCanvasElement | null} */
  #canvas = null;

  // Three.js objects stored as any to avoid dynamic-import shape issues
  /** @type {any} */
  #camera = null;
  /** @type {any} */
  #renderer = null;
  /** @type {any} */
  #model = null;
  /** @type {any} */
  #controls = null;
  /** @type {ResizeObserver | null} */
  #resizeObserver = null;
  /** @type {(() => void) | null} */
  #renderFn = null;
  /** @type {number | null} */
  #renderFrameId = null;

  constructor() {
    super();
    if (!StlViewerElement.#defined) {
      StlViewerElement.#defined = true;
    }
  }

  connectedCallback() {
    this.#src = this.getAttribute('src') || '';
    // Default color resolves from the --brand-primary CSS custom property.
    // The color prop can override it for exceptional models.
    this.#color = this.getAttribute('data-color') || '';
    this.#background = this.getAttribute('background') || null;

    const activateBtn = this.querySelector('.stl-activate');
    this.#status = this.querySelector('.stl-status');
    this.#canvas = this.querySelector('.stl-canvas');
    const resetBtn = this.querySelector('.stl-reset');

    activateBtn?.addEventListener('click', () => this.#activate(), { once: true });
    resetBtn?.addEventListener('click', () => this.#resetView());
  }

  disconnectedCallback() {
    this.#dispose();
  }

  /** @param {string} msg @param {string} [type] */
  #setStatus(msg, type) {
    if (!this.#status) return;
    this.#status.textContent = msg;
    this.#status.className = 'stl-status';
    if (type) this.#status.classList.add(`stl-status--${type}`);
  }

  /** Resolve the model color: explicit prop or fallback chain. */
  #resolveColor() {
    if (this.#color) return this.#color;
    const styles = getComputedStyle(this);
    return styles.getPropertyValue('--brand-primary').trim() || styles.color;
  }

  /** Theme observer — watches data-theme changes to update material color. */
  /** @type {MutationObserver | null} */
  #themeObserver = null;

  /** Update the model material color from current theme and request a render. */
  #updateColor() {
    if (!this.#model) return;
    const colorHex = this.#resolveColor();
    this.#model.material.color.set(colorHex);
    this.#renderFn?.();
  }

  async #activate() {
    if (this.#activated) return;
    this.#activated = true;
    this.#setStatus('Loading 3D viewer\u2026', 'loading');

    try {
      const THREE = await import('three');
      const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

      const scene = new THREE.Scene();
      if (this.#background) scene.background = new THREE.Color(this.#background);

      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(5, 10, 7);
      scene.add(dir);
      const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
      dir2.position.set(-5, -5, -5);
      scene.add(dir2);

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
      camera.position.set(0, 0, 10);
      this.#camera = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas: this.#canvas,
        antialias: true,
        alpha: !this.#background,
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      this.#renderer = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = false;
      controls.update();
      this.#controls = controls;

      const container = this.querySelector('.stl-container');
      const ro = new ResizeObserver(() => {
        const rect = container?.getBoundingClientRect();
        if (rect) this.#resize(rect.width, rect.height);
      });
      if (container) ro.observe(container);
      this.#resizeObserver = ro;

      // Coalesce render requests via requestAnimationFrame.
      // Does not call controls.update() — OrbitControls fires 'change'
      // on interaction, so update() inside the listener would recurse.
      const requestRender = () => {
        if (this.#renderFrameId !== null) return;
        this.#renderFrameId = requestAnimationFrame(() => {
          this.#renderFrameId = null;
          renderer.render(scene, camera);
        });
      };
      controls.addEventListener('change', requestRender);
      this.#renderFn = () => {
        controls.update();
        requestRender();
      };

      const canvas = this.#canvas;
      if (canvas) canvas.removeAttribute('hidden');
      const rst = this.querySelector('.stl-reset');
      if (rst) rst.removeAttribute('hidden');
      const poster = this.querySelector('.stl-poster');
      if (poster) poster.setAttribute('hidden', '');

      // Load STL
      this.#setStatus('Loading model\u2026', 'loading');
      const geometry = await new Promise((resolve, reject) => {
        new STLLoader().load(this.#src, resolve, undefined, reject);
      });

      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      if (box) {
        const cx = (box.max.x + box.min.x) / 2;
        const cy = (box.max.y + box.min.y) / 2;
        const cz = (box.max.z + box.min.z) / 2;
        geometry.translate(-cx, -cy, -cz);
      }

      const materialColor = this.#resolveColor();
      const material = new THREE.MeshStandardMaterial({
        color: materialColor,
        metalness: 0.3,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.#model = mesh;

      if (box) {
        const size = new THREE.Vector3().copy(box.max).sub(box.min);
        const maxDim = Math.max(size.x, size.y, size.z);
        const dist = maxDim * 2.5;
        camera.position.set(dist * 0.5, dist * 0.3, dist);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // Watch theme changes via data-theme attribute on <html>
      const themeObserver = new MutationObserver(() => {
        this.#updateColor();
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
      this.#themeObserver = themeObserver;

      this.#renderFn();
      this.#setStatus('', '');
    } catch (err) {
      console.error('STL viewer error:', err);
      const /** @type {string} */ msg =
          err instanceof TypeError || (err && /** @type {Error} */ (err).message?.includes('WebGL'))
            ? 'Could not initialize 3D viewer. Your browser may not support WebGL.'
            : 'Could not load 3D model.';
      this.#setStatus(msg, 'error');
    }
  }

  /** @param {number} width @param {number} height */
  #resize(width, height) {
    if (!this.#renderer || !this.#camera) return;
    this.#renderer.setSize(width, height);
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
    this.#renderFn?.();
  }

  #resetView() {
    if (!this.#controls || !this.#model) return;
    const box = this.#model.geometry.boundingBox;
    if (!box) return;
    const size = box.max.clone().sub(box.min);
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 2.5;
    this.#camera.position.set(dist * 0.5, dist * 0.3, dist);
    this.#controls.target.set(0, 0, 0);
    this.#controls.update();
    this.#renderFn?.();
  }

  #dispose() {
    if (this.#renderFrameId !== null) {
      cancelAnimationFrame(this.#renderFrameId);
      this.#renderFrameId = null;
    }
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#themeObserver?.disconnect();
    this.#themeObserver = null;
    if (this.#controls) {
      this.#controls.dispose();
      this.#controls = null;
    }
    if (this.#renderer) {
      this.#renderer.dispose();
      this.#renderer = null;
    }
    if (this.#model) {
      const g = this.#model.geometry;
      if (g) g.dispose();
      const m = this.#model.material;
      if (m) {
        if (Array.isArray(m)) {
          m.forEach((/** @type {any} */ mat) => {
            mat.dispose();
          });
        } else {
          m.dispose();
        }
      }
      this.#model = null;
    }
  }
}

customElements.define('stl-viewer', StlViewerElement);
