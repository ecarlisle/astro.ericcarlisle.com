const meta = {
  title: 'Foundations/Colors',
  component: `
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <section>
        <h2 style="margin-bottom: 1rem;">Background Colors</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-main); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-primary);">--bg-main</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">Main background</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-primary);">--bg-surface</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">Surface background</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-primary);">--bg-surface-elevated</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">Elevated surface</div>
          </div>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Text Colors</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="color: var(--text-primary); font-size: 1.25rem; font-weight: bold;">Primary Text</div>
            <code style="color: var(--text-muted); font-size: 0.875rem;">--text-primary</code>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="color: var(--text-secondary); font-size: 1.25rem; font-weight: bold;">Secondary Text</div>
            <code style="color: var(--text-muted); font-size: 0.875rem;">--text-secondary</code>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="color: var(--text-muted); font-size: 1.25rem; font-weight: bold;">Muted Text</div>
            <code style="color: var(--text-muted); font-size: 0.875rem;">--text-muted</code>
          </div>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Brand Colors</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 60px; background: var(--brand-primary); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--brand-primary</code>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 60px; background: var(--brand-accent); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--brand-accent</code>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 60px; background: var(--brand-highlight); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--brand-highlight</code>
          </div>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Semantic Colors</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 40px; background: var(--color-action); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--color-action</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Buttons, CTAs</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 40px; background: var(--color-action-hover); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--color-action-hover</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Button hover</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 40px; background: var(--color-link); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--color-link</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Default links</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 40px; background: var(--color-link-hover); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--color-link-hover</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Link hover</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 40px; background: var(--color-focus); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--color-focus</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Focus outlines</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="width: 100%; height: 40px; background: var(--color-success); margin-bottom: 0.5rem; border-radius: var(--radius-sm);"></div>
            <code style="color: var(--text-primary);">--color-success</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Success states</div>
          </div>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Border Colors</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-surface); border: 2px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-primary);">--border-main</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Primary border</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 2px solid var(--border-muted); border-radius: var(--radius-md);">
            <code style="color: var(--text-primary);">--border-muted</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Muted border</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 2px solid var(--border-control); border-radius: var(--radius-md);">
            <code style="color: var(--text-primary);">--border-control</code>
            <div style="color: var(--text-secondary); font-size: 0.875rem;">Control border</div>
          </div>
        </div>
      </section>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        component:
          'Color tokens define the visual palette for dark and light themes. All colors use CSS custom properties defined in `src/styles/global.css`. Use the toolbar above to toggle themes.',
      },
    },
  },
};

export default meta;

export const Palette = {};
