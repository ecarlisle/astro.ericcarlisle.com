const meta = {
  title: 'Foundations/Spacing',
  component: `
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <section>
        <h2 style="margin-bottom: 1rem;">Spacing Scale</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
          Spacing is based on the rhythm unit (1rem by default). All spacing tokens are multiples of this base value.
        </p>
        <div style="display: grid; gap: 1rem;">
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <code style="color: var(--text-muted); font-size: 0.875rem;">--space-xs</code>
              <span style="color: var(--text-secondary); font-size: 0.875rem;">calc(var(--rhythm) * 0.5)</span>
            </div>
            <div style="width: var(--space-xs); height: 24px; background: var(--brand-primary); border-radius: var(--radius-sm);"></div>
          </div>
          
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <code style="color: var(--text-muted); font-size: 0.875rem;">--space-sm</code>
              <span style="color: var(--text-secondary); font-size: 0.875rem;">calc(var(--rhythm) * 0.75)</span>
            </div>
            <div style="width: var(--space-sm); height: 24px; background: var(--brand-primary); border-radius: var(--radius-sm);"></div>
          </div>
          
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <code style="color: var(--text-muted); font-size: 0.875rem;">--space-md</code>
              <span style="color: var(--text-secondary); font-size: 0.875rem;">calc(var(--rhythm) * 1)</span>
            </div>
            <div style="width: var(--space-md); height: 24px; background: var(--brand-primary); border-radius: var(--radius-sm);"></div>
          </div>
          
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <code style="color: var(--text-muted); font-size: 0.875rem;">--space-lg</code>
              <span style="color: var(--text-secondary); font-size: 0.875rem;">calc(var(--rhythm) * 1.5)</span>
            </div>
            <div style="width: var(--space-lg); height: 24px; background: var(--brand-primary); border-radius: var(--radius-sm);"></div>
          </div>
          
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <code style="color: var(--text-muted); font-size: 0.875rem;">--space-xl</code>
              <span style="color: var(--text-secondary); font-size: 0.875rem;">calc(var(--rhythm) * 2)</span>
            </div>
            <div style="width: var(--space-xl); height: 24px; background: var(--brand-primary); border-radius: var(--radius-sm);"></div>
          </div>
          
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <code style="color: var(--text-muted); font-size: 0.875rem;">--space-section</code>
              <span style="color: var(--text-secondary); font-size: 0.875rem;">calc(var(--rhythm) * 2.5)</span>
            </div>
            <div style="width: var(--space-section); height: 24px; background: var(--brand-primary); border-radius: var(--radius-sm);"></div>
          </div>
          
          <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <code style="color: var(--text-muted); font-size: 0.875rem;">--space-layout</code>
              <span style="color: var(--text-secondary); font-size: 0.875rem;">calc(var(--rhythm) * 3)</span>
            </div>
            <div style="width: var(--space-layout); height: 24px; background: var(--brand-primary); border-radius: var(--radius-sm);"></div>
          </div>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Spacing in Practice</h2>
        <div style="display: grid; gap: var(--space-md);">
          <div style="padding: var(--space-md); background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <p style="margin: 0; color: var(--text-primary);">Card with --space-md padding</p>
          </div>
          <div style="padding: var(--space-lg); background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <p style="margin: 0; color: var(--text-primary);">Card with --space-lg padding</p>
          </div>
          <div style="padding: var(--space-xl); background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
            <p style="margin: 0; color: var(--text-primary);">Card with --space-xl padding</p>
          </div>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Inline Spacing</h2>
        <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
          <div style="display: flex; gap: var(--space-xs); margin-bottom: 1rem;">
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 1</div>
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 2</div>
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 3</div>
          </div>
          <code style="color: var(--text-muted); font-size: 0.875rem;">gap: var(--space-xs)</code>
        </div>
        
        <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md); margin-top: 1rem;">
          <div style="display: flex; gap: var(--space-md); margin-bottom: 1rem;">
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 1</div>
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 2</div>
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 3</div>
          </div>
          <code style="color: var(--text-muted); font-size: 0.875rem;">gap: var(--space-md)</code>
        </div>
        
        <div style="padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md); margin-top: 1rem;">
          <div style="display: flex; gap: var(--space-lg); margin-bottom: 1rem;">
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 1</div>
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 2</div>
            <div style="padding: 0.5rem 1rem; background: var(--brand-primary); color: var(--bg-main); border-radius: var(--radius-sm);">Item 3</div>
          </div>
          <code style="color: var(--text-muted); font-size: 0.875rem;">gap: var(--space-lg)</code>
        </div>
      </section>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        component:
          'Spacing tokens provide consistent vertical and horizontal rhythm throughout the design system. All spacing values are multiples of the base rhythm unit defined in `src/styles/global.css`.',
      },
    },
  },
};

export default meta;

export const SpacingSystem = {};
