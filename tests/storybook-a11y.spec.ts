import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const stories = [
  // Card stories
  { name: 'Card - Default', url: '/iframe.html?id=components-card--default&viewMode=story' },
  { name: 'Card - WithoutLink', url: '/iframe.html?id=components-card--without-link&viewMode=story' },
  { name: 'Card - WithTags', url: '/iframe.html?id=components-card--with-tags&viewMode=story' },
  { name: 'Card - LongContent', url: '/iframe.html?id=components-card--long-content&viewMode=story' },
  { name: 'Card - ArticleElement', url: '/iframe.html?id=components-card--article-element&viewMode=story' },
  { name: 'Card - H3Heading', url: '/iframe.html?id=components-card--h-3-heading&viewMode=story' },
  
  // ThemeToggle stories
  { name: 'ThemeToggle - Default', url: '/iframe.html?id=components-themetoggle--default&viewMode=story' },
  { name: 'ThemeToggle - InHeader', url: '/iframe.html?id=components-themetoggle--in-header&viewMode=story' },
  
  // SocialLinks stories
  { name: 'SocialLinks - Default', url: '/iframe.html?id=components-sociallinks--default&viewMode=story' },
  { name: 'SocialLinks - InFooter', url: '/iframe.html?id=components-sociallinks--in-footer&viewMode=story' },
  { name: 'SocialLinks - InHeader', url: '/iframe.html?id=components-sociallinks--in-header&viewMode=story' },
];

for (const story of stories) {
  test(`Storybook a11y: ${story.name}`, async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60s
    
    await page.goto(`http://localhost:6006${story.url}`);
    await page.waitForLoadState('load');
    
    // Wait for Storybook to render the story content
    await page.waitForSelector('#storybook-root', { state: 'attached' });
    await page.waitForTimeout(2000); // Allow time for Astro components to render
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({ runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })
      .analyze();
    
    const violations = accessibilityScanResults.violations;
    const incomplete = accessibilityScanResults.incomplete;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Story: ${story.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Violations: ${violations.length}`);
    console.log(`Incomplete (manual review): ${incomplete.length}`);
    
    if (violations.length > 0) {
      console.log('\nViolations:');
      violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Help URL: ${violation.helpUrl}`);
        console.log(`   Nodes affected: ${violation.nodes.length}`);
        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`   Node ${nodeIndex + 1}: ${node.target.join(', ')}`);
          console.log(`     Failure: ${node.failureSummary}`);
        });
      });
    }
    
    if (incomplete.length > 0) {
      console.log('\nIncomplete checks (require manual review):');
      incomplete.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.id}: ${item.description}`);
        console.log(`   Impact: ${item.impact}`);
        console.log(`   Help: ${item.help}`);
      });
    }
    
    if (violations.length === 0 && incomplete.length === 0) {
      console.log('\n✅ No accessibility violations detected');
    }
    
    expect(violations).toEqual([]);
  });
}
