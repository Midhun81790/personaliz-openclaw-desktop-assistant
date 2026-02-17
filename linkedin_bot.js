import { chromium } from 'playwright';

// =====================================
// LinkedIn Posting Automation Script
// =====================================
// This script demonstrates SAFE browser automation for LinkedIn posting
// SECURITY: Login is manual (no credentials stored)
// SAFETY: Posting requires manual approval (no auto-submit)
// VISIBILITY: Browser is visible (headless: false) for transparency

// =====================================
// Parse Command Line Arguments
// =====================================
// Get post text from command line: node linkedin_bot.js "Your post content"
// Example: node linkedin_bot.js "AI trends are fascinating! #AI #Tech"
const args = process.argv.slice(2);
const customPostText = args.join(' '); // Join all arguments as post text

(async () => {
  try {
    console.log("🚀 Starting LinkedIn Automation Script...\n");

    // =====================================
    // STEP 1: Launch Browser
    // =====================================
    // Launch Chromium in NON-headless mode (visible browser window)
    // slowMo adds 100ms delay between actions for better visibility
    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 100
    });

    // Create browser context with realistic settings
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    console.log("✅ Browser launched successfully");

    // =====================================
    // STEP 2: Navigate to LinkedIn
    // =====================================
    console.log("🌐 Navigating to LinkedIn...");
    
    // Go directly to login page (faster than homepage redirect)
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

    // Detect when user completes login by checking URL changes
    // We look for navigation away from login/checkpoint pages
    try {
      await page.waitForFunction(() => {
        const url = window.location.href;
        // User is logged in when URL contains feed OR is on linkedin.com but NOT on login/checkpoint
        return url.includes('/feed/') || 
               (url.includes('linkedin.com') && 
                !url.includes('/login') && 
                !url.includes('/checkpoint'));
      }, { timeout: 900000 }); // 15 minutes timeout
    } catch (e) {
      // If timeout or error, try navigating to feed manually
      console.log("⏳ Attempting to navigate to feed...");
      await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
    }
    
    console.log("✅ Login successful! You're now on LinkedIn.\n");
    
    // =====================================
    // STEP 4: Ensure We're on Feed Page
    // =====================================
    // LinkedIn might redirect to profile or other pages after login
    // Make sure we're on the feed where we can create posts
    if (!page.url().includes('/feed/')) {
      console.log("🔄 Navigating to feed page...");
      await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
    }

    // =====================================
    // STEP 5: Wait for Feed to Load
    // =====================================
    console.log("⏳ Waiting for feed to fully load...");
    
    // Wait for the "Start a post" button to be visible
    // This indicates the feed is ready for interaction
    await page.waitForSelector('button:has-text("Start a post")', { 
      timeout: 10000 
    });
    
    console.log("✅ Feed loaded successfully\n");

    // Additional delay to ensure all JavaScript has loaded
    await page.waitForTimeout(2000);

    // =====================================
    // STEP 6: Click "Start a Post"
    // =====================================
    console.log("🖱️  Clicking 'Start a post' button...");
    
    // Use safe selector: look for button with specific text
    // .first() ensures we click the main feed button, not profile version
    const startPostButton = await page.locator('button:has-text("Start a post")').first();
    await startPostButton.click();
    
    console.log("✅ Post editor opened\n");

    // Wait for post modal/editor to fully appear
    await page.waitForTimeout(1500);

    // =====================================
    // STEP 7: Insert Text into Post Editor
    // =====================================
    console.log("⌨️  Typing post content...");
    
    // Use custom text from command line if provided, otherwise use default template
    const postText = customPostText || `🚀 Excited to share my latest project!

I've been building an AI-powered desktop assistant using Tauri and React. This tool helps automate repetitive tasks and boost productivity.

Key features:
✅ Browser automation with Playwright
✅ Cross-platform desktop app
✅ Modern React UI

#WebDevelopment #Automation #React #Tauri #JavaScript`;

    console.log("📝 Post text source:", customPostText ? "Command line argument" : "Default template");

    // Find the contenteditable div (LinkedIn's post editor)
    // LinkedIn uses contenteditable="true" for the text editor
    const postEditor = await page.locator('[contenteditable="true"]').first();
    
    // Click to focus the editor
    await postEditor.click();
    
    // Fill the content (Playwright handles this safely)
    await postEditor.fill(postText);
    
    console.log("✅ Post content inserted\n");
    
    // =====================================
    // STEP 8: Highlight Editor Visually
    // =====================================
    console.log("🎨 Highlighting post editor for visibility...");
    
    // Add visual highlight to the editor so user can see what was filled
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) {
        // Add a prominent border and background highlight
        editor.style.border = '3px solid #00a0dc';
        editor.style.backgroundColor = '#e8f4f8';
        editor.style.boxShadow = '0 0 20px rgba(0, 160, 220, 0.5)';
        editor.style.transition = 'all 0.3s ease';
      }
    });
    
    console.log("✅ Editor highlighted with blue border and background\n");
    
    // =====================================
    // STEP 9: Display Post Preview
    // =====================================
    console.log("📝 Post preview:");
    console.log("─".repeat(50));
    console.log(postText);
    console.log("─".repeat(50));
    console.log();

    // =====================================
    // STEP 10: Wait for Manual Approval
    // =====================================
    console.log("⏸️  ⚠️  WAITING FOR USER APPROVAL BEFORE POSTING ⚠️");
    console.log("─".repeat(50));
    console.log("   👉 Review the highlighted post in the browser");
    console.log("   👉 Make any edits if needed");
    console.log("   👉 Click the 'Post' button manually when ready");
    console.log("   👉 Or close the browser to cancel\n");
    console.log("   ⏱️  Browser will stay open for 10 minutes");
    console.log("─".repeat(50));
    console.log();
    
    console.log("🔒 SAFETY: This script will NOT click Post automatically!");
    console.log("💡 You have full control over the final posting decision.\n");

    // Keep browser alive for manual review and posting
    // User manually clicks "Post" button when satisfied
    // This is intentional for safety - no auto-submit!
    await page.waitForTimeout(600000); // 10 minutes

    console.log("\n⏰ 10-minute window expired");
    console.log("✅ Script completed successfully!");
    console.log("🔒 Closing browser...");
    
    await browser.close();

  } catch (error) {
    console.error("\n❌ Error occurred:", error.message);
    console.error("\n📋 Troubleshooting tips:");
    console.error("   • Make sure you're logged into LinkedIn");
    console.error("   • Check your internet connection");
    console.error("   • LinkedIn may have updated their UI - selectors might need adjustment");
    console.error("   • Try running: npx playwright install chromium");
  }
})();
