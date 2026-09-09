const meta = {
  title: 'Foundations/Typography',
  component: `
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <section>
        <h2 style="margin-bottom: 1rem;">Font Families</h2>
        <div style="display: grid; gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--font-headers</code>
            <div style="font-family: var(--font-headers); font-size: var(--type-size-h3); color: var(--text-primary); margin-top: 0.5rem;">
              Plus Jakarta Sans
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--font-copy</code>
            <div style="font-family: var(--font-copy); font-size: var(--type-size-h3); color: var(--text-primary); margin-top: 0.5rem;">
              Source Sans 3
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--font-mono</code>
            <div style="font-family: var(--font-mono); font-size: var(--type-size-h3); color: var(--text-primary); margin-top: 0.5rem;">
              Fira Code
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Type Scale</h2>
        <div style="display: grid; gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--type-size-h1</code>
            <div style="font-size: var(--type-size-h1); line-height: var(--line-height-h1); color: var(--text-primary); margin-top: 0.5rem;">
              Heading 1
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--type-size-h2</code>
            <div style="font-size: var(--type-size-h2); line-height: var(--line-height-h2); color: var(--text-primary); margin-top: 0.5rem;">
              Heading 2
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--type-size-h3</code>
            <div style="font-size: var(--type-size-h3); line-height: var(--line-height-h3); color: var(--text-primary); margin-top: 0.5rem;">
              Heading 3
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--type-size-h4</code>
            <div style="font-size: var(--type-size-h4); line-height: var(--line-height-h4); color: var(--text-primary); margin-top: 0.5rem;">
              Heading 4
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--type-size-h5</code>
            <div style="font-size: var(--type-size-h5); line-height: var(--line-height-h5); color: var(--text-primary); margin-top: 0.5rem;">
              Heading 5
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--type-size-body</code>
            <div style="font-size: var(--type-size-body); line-height: var(--line-height-body); color: var(--text-primary); margin-top: 0.5rem;">
              Body text for paragraphs and general content
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--type-size-small</code>
            <div style="font-size: var(--type-size-small); line-height: var(--line-height-body); color: var(--text-primary); margin-top: 0.5rem;">
              Small text for captions and metadata
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Font Weights</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--font-weight-normal</code>
            <div style="font-weight: var(--font-weight-normal); font-size: var(--type-size-h4); color: var(--text-primary); margin-top: 0.5rem;">
              Normal (400)
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--font-weight-medium</code>
            <div style="font-weight: var(--font-weight-medium); font-size: var(--type-size-h4); color: var(--text-primary); margin-top: 0.5rem;">
              Medium (500)
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--font-weight-bold</code>
            <div style="font-weight: var(--font-weight-bold); font-size: var(--type-size-h4); color: var(--text-primary); margin-top: 0.5rem;">
              Bold (700)
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <code style="color: var(--text-muted); font-size: 0.875rem;">--font-weight-black</code>
            <div style="font-weight: var(--font-weight-black); font-size: var(--type-size-h4); color: var(--text-primary); margin-top: 0.5rem;">
              Black (900)
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        component:
          'Typography tokens define font families, sizes, weights, and line heights. All values use CSS custom properties defined in `packages/design-system/src/styles/tokens.css`.',
      },
    },
  },
};

export default meta;

export const TypeSystem = {};
