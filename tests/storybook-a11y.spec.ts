import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const stories = [
  // Card
  { name: 'Card - Default', url: 'components-card--default' },
  { name: 'Card - WithoutLink', url: 'components-card--without-link' },
  { name: 'Card - WithTags', url: 'components-card--with-tags' },
  { name: 'Card - LongContent', url: 'components-card--long-content' },
  { name: 'Card - ArticleElement', url: 'components-card--article-element' },
  { name: 'Card - H3Heading', url: 'components-card--h-3-heading' },
  // ThemeToggle
  { name: 'Header - Default', url: 'navigation-header--default' },
  { name: 'Header - NarrowViewport', url: 'navigation-header--narrow-viewport' },
  // ThemeToggle
  { name: 'ThemeToggle - Default', url: 'components-themetoggle--default' },
  { name: 'ThemeToggle - InHeader', url: 'components-themetoggle-in-header--in-header' },
  // SocialLinks
  { name: 'SocialLinks - Default', url: 'components-sociallinks--default' },
  { name: 'SocialLinks - InFooter', url: 'components-sociallinks-in-footer--in-footer' },
  { name: 'SocialLinks - InHeader', url: 'components-sociallinks-in-header--in-header' },
  // PaginationNav
  { name: 'PaginationNav - PrevAndNext', url: 'components-paginationnav--prev-and-next' },
  { name: 'PaginationNav - PreviousOnly', url: 'components-paginationnav--previous-only' },
  { name: 'PaginationNav - NextOnly', url: 'components-paginationnav--next-only' },
  { name: 'PaginationNav - LongLabels', url: 'components-paginationnav--long-labels' },
  { name: 'PaginationNav - NarrowContainer', url: 'components-paginationnav--narrow-container' },
  // TagFilterBar
  { name: 'TagFilterBar - Default', url: 'components-tagfilterbar--default' },
  { name: 'TagFilterBar - SingleTag', url: 'components-tagfilterbar--single-tag' },
  { name: 'TagFilterBar - ManyTags', url: 'components-tagfilterbar--many-tags' },
  { name: 'TagFilterBar - LongTagLabels', url: 'components-tagfilterbar--long-tag-labels' },
  { name: 'TagFilterBar - NarrowViewport', url: 'components-tagfilterbar--narrow-viewport' },
  // ShareStrip
  { name: 'ShareStrip - Default', url: 'components-sharestrip--default' },
  { name: 'ShareStrip - NarrowWidth', url: 'components-sharestrip--narrow-width' },
  { name: 'ShareStrip - LongTitle', url: 'components-sharestrip--long-title' },
  { name: 'ShareStrip - LongUrl', url: 'components-sharestrip--long-url' },
];

for (const story of stories) {
  test(`Storybook a11y: ${story.name}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`/design-system/lab/iframe.html?id=${story.url}&viewMode=story`);
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
      violations.forEach((v) => {
        console.log(`\n${v.id}: ${v.description}`);
        console.log(`   Impact: ${v.impact}`);
        console.log(`   Nodes: ${v.nodes.length}`);
      });
    }

    if (incomplete.length > 0) {
      incomplete.forEach((item) => {
        console.log(`   Incomplete: ${item.id} (${item.impact})`);
      });
    }

    if (violations.length === 0) console.log('✅ No violations');
    expect(violations).toEqual([]);
  });
}
