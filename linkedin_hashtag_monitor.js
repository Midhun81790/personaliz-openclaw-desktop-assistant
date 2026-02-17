import { chromium } from 'playwright';

// =====================================
// LinkedIn Hashtag Monitor Script
// =====================================
// This script demonstrates SAFE LinkedIn hashtag monitoring
// SECURITY: Manual login required (no credentials stored)
// SAFETY: View-only mode (no auto-interactions)
// VISIBILITY: Browser visible for transparency

// Parse command line argument for hashtag
const args = process.argv.slice(2);
const hashtag = args[0] || '#openclaw';

(async () => {
  try {
    console.log("🔍 Starting LinkedIn Hashtag Monitor...\n");
    console.log(`📊 Monitoring hashtag: ${hashtag}\n`);

    // =====================================
    // STEP 1: Launch Browser
    // =====================================
    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 100
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    console.log("✅ Browser launched successfully");

    // =====================================
    // STEP 2: Navigate to LinkedIn Login
    // =====================================
    console.log("🌐 Navigating to LinkedIn...");
    await page.goto('https://www.linkedin.com/login', { 
      waitUntil: 'domcontentloaded' 
    });
    console.log("✅ LinkedIn login page loaded");

    // =====================================
    // STEP 3: Wait for Manual Login
    // =====================================
    console.log("\n⏳ MANUAL ACTION REQUIRED:");
    console.log("   👉 Please log in to LinkedIn manually");
    console.log("   ⏱️  Waiting up to 15 minutes...\n");

    try {
      await page.waitForFunction(() => {
        const url = window.location.href;
        return url.includes('/feed/') || 
               (url.includes('linkedin.com') && 
                !url.includes('/login') && 
                !url.includes('/checkpoint'));
      }, { timeout: 900000 });
    } catch (e) {
      console.log("⏳ Attempting to navigate to feed...");
      await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
    }
    
    console.log("✅ Login successful!\n");

    // =====================================
    // STEP 4: Navigate to Hashtag Search
    // =====================================
    console.log(`🔎 Searching for ${hashtag}...`);
    
    // Clean hashtag (remove # if present, we'll add it in URL)
    const cleanHashtag = hashtag.replace('#', '');
    
    // Navigate to hashtag feed
    const hashtagUrl = `https://www.linkedin.com/feed/hashtag/${cleanHashtag}/`;
    await page.goto(hashtagUrl, { waitUntil: 'domcontentloaded' });
    
    console.log(`✅ Opened ${hashtag} feed\n`);
    await page.waitForTimeout(3000);

    // =====================================
    // STEP 5: Scroll and Analyze Posts
    // =====================================
    console.log("📜 Scrolling through posts...");
    console.log("─".repeat(50));
    
    // Scroll down a few times to load more posts
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(2000);
      console.log(`   Scroll ${i + 1}/3 - Loading more content...`);
    }
    
    console.log("─".repeat(50));
    console.log("✅ Post loading complete\n");

    // =====================================
    // STEP 6: Count Visible Posts (Demo)
    // =====================================
    console.log("📊 Analyzing feed...");
    
    const postCount = await page.evaluate(() => {
      // LinkedIn posts are typically in feed-shared-update-v2 containers
      const posts = document.querySelectorAll('[data-urn*="Activity"]');
      return posts.length;
    });
    
    console.log(`   📝 Found approximately ${postCount} posts in feed`);
    console.log(`   🏷️  Hashtag: ${hashtag}`);
    console.log(`   ⏰ Monitored at: ${new Date().toLocaleString()}`);
    console.log();

    // =====================================
    // STEP 7: Highlight Hashtag Feed
    // =====================================
    console.log("🎨 Highlighting feed for visibility...");
    
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        main.style.border = '3px solid #00a0dc';
        main.style.boxShadow = '0 0 20px rgba(0, 160, 220, 0.3)';
      }
    });
    
    console.log("✅ Feed highlighted\n");

    // =====================================
    // STEP 8: Wait for Manual Review
    // =====================================
    console.log("⏸️  MONITORING COMPLETE");
    console.log("─".repeat(50));
    console.log("   👀 Review the posts manually in the browser");
    console.log("   📌 Identify engagement opportunities");
    console.log("   💡 Browser will stay open for 5 minutes");
    console.log("─".repeat(50));
    console.log();
    
    console.log("🔒 SAFETY: This script does NOT auto-like or auto-comment!");
    console.log("💡 All interactions must be done manually.\n");

    // Keep browser open for manual review
    await page.waitForTimeout(300000); // 5 minutes

    console.log("\n⏰ Monitoring window expired");
    console.log("✅ Script completed successfully!");
    console.log("🔒 Closing browser...");
    
    await browser.close();

  } catch (error) {
    console.error("\n❌ Error occurred:", error.message);
    console.error("\n📋 Troubleshooting tips:");
    console.error("   • Make sure you're logged into LinkedIn");
    console.error("   • Check your internet connection");
    console.error("   • Verify the hashtag exists on LinkedIn");
  }
})();
