import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const stories = [
  { name: 'Card - Default', url: 'components-card--default' },
  { name: 'Card - WithoutLink', url: 'components-card--without-link' },
  { name: 'Card - WithTags', url: 'components-card--with-tags' },
  { name: 'Card - LongContent', url: 'components-card--long-content' },
  { name: 'Card - ArticleElement', url: 'components-card--article-element' },
  { name: 'Card - H3Heading', url: 'components-card--h-3-heading' },
  { name: 'ThemeToggle - Default', url: 'components-themetoggle--default' },
  { name: 'ThemeToggle - InHeader', url: 'components-themetoggle-in-header--in-header' },
  { name: 'SocialLinks - Default', url: 'components-sociallinks--default' },
  { name: 'SocialLinks - InFooter', url: 'components-sociallinks-in-footer--in-footer' },
  { name: 'SocialLinks - InHeader', url: 'components-sociallinks-in-header--in-header' },
];

for (const story of stories) {
  test(`Storybook a11y: ${story.name}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`http://localhost:6006/iframe.html?id=${story.url}&viewMode=story`);
    await page.waitForLoadState('load');
    await page.waitForSelector('#storybook-root', { state: 'attached' });
    await page.waitForTimeout(2000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({ runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })
      .analyze();

    const violations = accessibilityScanResults.violations;
    const incomplete = accessibilityScanResults.incomplete;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Story: ${story.name}`);
    console.log(`Violations: ${violations.length}`);
    console.log(`Incomplete: ${incomplete.length}`);

    if (violations.length > 0) {
      violations.forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.id}: ${v.description}`);
        console.log(`   Impact: ${v.impact}`);
        console.log(`   Nodes: ${v.nodes.length}`);
      });
    }

    if (violations.length === 0) console.log('✅ No violations');
    expect(violations).toEqual([]);
  });
}
