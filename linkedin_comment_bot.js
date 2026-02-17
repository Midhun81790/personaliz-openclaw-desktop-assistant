import { chromium } from 'playwright';

// =====================================
// LinkedIn Auto-Commenting Bot
// =====================================
// This script searches for #openclaw posts and adds promotional comments
// SAFETY: Requires manual approval before commenting
// VISIBILITY: Browser is visible for transparency

const args = process.argv.slice(2);
const commentText = args.length > 0 ? args.join(' ') : 
  `Great insights! Thanks for sharing this with the #openclaw community. 🚀\n\nThis aligns perfectly with what we're working on in terms of automation and productivity.\n\n#automation #productivity #tech`;

(async () => {
  try {
    console.log("🚀 Starting LinkedIn Auto-Commenting Bot...\n");

    // =====================================
    // STEP 1: Launch Browser
    // =====================================
    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 100
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    console.log("✅ Browser launched successfully");

    // =====================================
    // STEP 2: Navigate to LinkedIn
    // =====================================
    console.log("🌐 Navigating to LinkedIn...");
    await page.goto('https://www.linkedin.com/login', { 
      waitUntil: 'domcontentloaded' 
    });
    
    console.log("✅ At login page");

    // =====================================
    // STEP 3: Wait for Manual Login
    // =====================================
    console.log("\n⏳ PLEASE LOG IN MANUALLY");
    console.log("   This script will continue once you're logged in...");
    console.log("   (Waiting up to 15 minutes)\n");

    try {
      await page.waitForFunction(() => {
        const url = window.location.href;
        return url.includes('linkedin.com/feed') || 
               (url.includes('linkedin.com') && !url.includes('/login'));
      }, { timeout: 900000 }); // 15 minutes
      
      console.log("✅ Login detected!");
    } catch (timeoutError) {
      console.log("❌ Login timeout. Please try again.");
      await browser.close();
      process.exit(1);
    }

    // =====================================
    // STEP 4: Search for #openclaw
    // =====================================
    console.log("\n🔍 Searching for #openclaw posts...");
    
    await page.goto('https://www.linkedin.com/search/results/content/?keywords=%23openclaw&sid=6X-', {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(3000);
    console.log("✅ Search results loaded");

    // =====================================
    // STEP 5: Scroll to Load Posts
    // =====================================
    console.log("📜 Loading posts...");
    
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
    }

    // =====================================
    // STEP 6: Find Comment Buttons
    // =====================================
    console.log("\n🎯 Looking for posts to comment on...");
    
    // Try multiple selectors for comment buttons
    let commentButtons = await page.$$('button[aria-label*="Comment"]');
    
    if (commentButtons.length === 0) {
      console.log("⏳ Trying alternative selectors...");
      commentButtons = await page.$$('button.comment-button, button[data-control-name="comment"], button.social-actions-button--comment');
    }
    
    if (commentButtons.length === 0) {
      console.log("⏳ Trying generic button selector...");
      const allButtons = await page.$$('button');
      for (const button of allButtons) {
        const text = await button.textContent();
        if (text && text.toLowerCase().includes('comment')) {
          commentButtons.push(button);
        }
      }
    }
    
    console.log(`Found ${commentButtons.length} posts with comment buttons`);

    if (commentButtons.length === 0) {
      console.log("❌ No posts found. The page might need manual navigation.");
      console.log("⏳ Keeping browser open for 2 minutes for you to manually test...");
      console.log("💡 TIP: Try clicking a Comment button manually to test!");
      await page.waitForTimeout(120000);
      await browser.close();
      process.exit(0);
    }

    // =====================================
    // STEP 7: Click First Comment Button
    // =====================================
    console.log("\n📝 Clicking first comment button...");
    
    await commentButtons[0].click();
    await page.waitForTimeout(2000);

    // =====================================
    // STEP 8: Fill Comment Box
    // =====================================
    console.log("✍️ Looking for comment input box...");
    
    // Wait a bit longer for comment box to appear
    await page.waitForTimeout(3000);
    
    // Try multiple selectors for comment input
    let commentBox = await page.$('.ql-editor[data-placeholder*="comment"]');
    
    if (!commentBox) {
      console.log("⏳ Trying alternative comment box selectors...");
      commentBox = await page.$('div[contenteditable="true"][role="textbox"]');
    }
    
    if (!commentBox) {
      commentBox = await page.$('div.ql-editor');
    }
    
    if (!commentBox) {
      commentBox = await page.$('textarea[placeholder*="comment" i]');
    }
    
    if (commentBox) {
      console.log("✅ Found comment box!");
      await commentBox.click();
      await page.waitForTimeout(500);
      
      // Try to type the comment
      try {
        await commentBox.type(commentText, { delay: 50 });
      } catch {
        // If type fails, try fill
        await commentBox.fill(commentText);
      }
      
      // Highlight the comment box
      await page.evaluate(() => {
        const boxes = document.querySelectorAll('.ql-editor[data-placeholder*="comment"], div[contenteditable="true"][role="textbox"]');
        boxes.forEach(box => {
          box.style.border = '3px solid #0066cc';
          box.style.backgroundColor = '#e8f4f8';
          box.style.boxShadow = '0 0 10px rgba(0, 102, 204, 0.5)';
        });
      });

      console.log("✅ Comment filled successfully");
      console.log("\n" + "═".repeat(60));
      console.log("📝 COMMENT PREVIEW:");
      console.log("─".repeat(60));
      console.log(commentText);
      console.log("═".repeat(60));
      
      console.log("\n⚠️  MANUAL APPROVAL REQUIRED");
      console.log("👀 Please review the highlighted comment");
      console.log("✅ If you approve: Click the 'Post' button manually");
      console.log("❌ If you reject: Just close this browser window");
      console.log("\n⏳ Waiting 10 minutes for your decision...\n");

      // Wait 10 minutes for user to review and post
      await page.waitForTimeout(600000);

      console.log("\n✅ Auto-commenting session complete");
      console.log("   Closing browser in 10 seconds...");
      await page.waitForTimeout(10000);

    } else {
      console.log("❌ Could not find comment box");
      console.log("⏳ Keeping browser open for manual interaction...");
      await page.waitForTimeout(120000);
    }

    await browser.close();
    console.log("👋 Browser closed");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
