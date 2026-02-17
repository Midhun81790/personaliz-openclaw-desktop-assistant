import { chromium } from 'playwright';

/**
 * LinkedIn Trending Topics Scraper
 * Finds trending topics by analyzing LinkedIn feed and hashtags
 * Used for Demo 1 - Trending Post Agent
 */

(async () => {
  console.log('[TRENDING] Starting trending topics search...');

  const browser = await chromium.launch({
    headless: false, // Visible for transparency
    slowMo: 100 // Slower automation for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to LinkedIn login
    console.log('[TRENDING] Navigating to LinkedIn...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });

    // Wait for manual login
    console.log('[TRENDING] ⏳ Please log in manually within 15 minutes...');
    console.log('[TRENDING] Waiting for /feed URL...');
    
    await page.waitForURL('**/feed/**', { timeout: 900000 }); // 15 minutes
    
    console.log('[TRENDING] ✅ Login successful!');
    await page.waitForTimeout(2000);

    // Scrape trending hashtags
    console.log('[TRENDING] Searching for trending hashtags...');
    
    // Scroll to load more content
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
    }

    // Find all hashtags
    const hashtags = await page.$$eval('a[href*="/feed/hashtag/"]', elements => {
      return elements.map(el => ({
        tag: el.textContent?.trim() || '',
        href: el.getAttribute('href') || ''
      }));
    });

    // Count hashtag frequency
    const hashtagCounts = new Map();
    hashtags.forEach(({ tag }) => {
      if (tag && tag.startsWith('#')) {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      }
    });

    // Sort by frequency
    const trending = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\n[TRENDING] 📊 Top 10 Trending Hashtags:');
    console.log('═'.repeat(50));
    trending.forEach(([tag, count], index) => {
      console.log(`${index + 1}. ${tag} (${count} mentions)`);
    });
    console.log('═'.repeat(50));

    // Also check popular post topics
    console.log('\n[TRENDING] Analyzing popular posts...');
    
    const posts = await page.$$eval('span[dir="ltr"]', elements => {
      return elements
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 20 && text.length < 200)
        .slice(0, 10);
    });

    console.log('\n[TRENDING] 🔥 Popular Post Topics:');
    console.log('═'.repeat(50));
    posts.forEach((post, index) => {
      const preview = post.substring(0, 80) + (post.length > 80 ? '...' : '');
      console.log(`${index + 1}. ${preview}`);
    });
    console.log('═'.repeat(50));

    // Extract keywords from trending topics
    const allText = trending.map(([tag]) => tag.toLowerCase()).join(' ');
    const keywords = extractKeywords(allText);

    console.log('\n[TRENDING] 🎯 Suggested Topics for Posts:');
    console.log('═'.repeat(50));
    keywords.slice(0, 10).forEach((keyword, index) => {
      console.log(`${index + 1}. ${keyword}`);
    });
    console.log('═'.repeat(50));

    // Return results as JSON
    const results = {
      trending_hashtags: trending.map(([tag, count]) => ({ tag, count })),
      popular_topics: keywords.slice(0, 10),
      post_samples: posts.slice(0, 5),
      scraped_at: new Date().toISOString()
    };

    console.log('\n[TRENDING] ✅ Scraping complete!');
    console.log('[TRENDING] Results saved to trending_topics.json');

    // Save to file
    require('fs').writeFileSync(
      'trending_topics.json',
      JSON.stringify(results, null, 2)
    );

    // Keep browser open for 10 seconds for review
    console.log('\n[TRENDING] Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('[TRENDING] ❌ Error:', error.message);
    
    if (error.message.includes('Timeout')) {
      console.error('[TRENDING] Login timeout - please log in faster next time');
    }
  } finally {
    await browser.close();
    console.log('[TRENDING] Browser closed.');
  }
})();

/**
 * Extract meaningful keywords from text
 * @param {string} text - Text to analyze
 * @returns {string[]} - Array of keywords
 */
function extractKeywords(text) {
  // Remove stopwords
  const stopwords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having']);
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopwords.has(word));

  // Count word frequency
  const wordCounts = new Map();
  words.forEach(word => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  // Sort by frequency
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}
