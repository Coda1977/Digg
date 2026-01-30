/**
 * Puppeteer Client for PDF Generation
 *
 * Uses @sparticuz/chromium-min for Vercel serverless compatibility.
 * The chromium binary is downloaded from a remote URL on first run.
 * Loads custom fonts (Noto Sans Hebrew, Inter) for Hebrew/Latin text support.
 */

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
// Remote URL for chromium binary (required for Vercel deployment)
// This URL points to the official Sparticuz chromium binary for AWS Lambda/Vercel
// Using x64 architecture to match Vercel's serverless environment
const CHROMIUM_REMOTE_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v140.0.0/chromium-v140.0.0-pack.x64.tar";

// Disable WebGL for faster startup in serverless
chromium.setGraphicsMode = false;

/**
 * Create a Puppeteer browser instance
 * Configured for Vercel serverless environment
 */
async function createBrowser(): Promise<ReturnType<typeof puppeteer.launch>> {
  // NOTE: We no longer use file-based font loading (chromiumWithFonts.font())
  // because fonts are embedded as base64 in CSS. The file-based approach
  // was causing issues on Vercel where public folder isn't accessible.
  const isDev = process.env.NODE_ENV === "development";

  // Use local Chrome in development, remote chromium-min in production
  // The remote URL downloads and extracts chromium on first run
  const executablePath = isDev
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : await chromium.executablePath(CHROMIUM_REMOTE_URL);

  const browser = await puppeteer.launch({
    args: isDev ? ["--no-sandbox", "--disable-setuid-sandbox"] : chromium.args,
    defaultViewport: {
      width: 794,  // A4 width at 96 DPI
      height: 1123, // A4 height at 96 DPI
    },
    executablePath,
    headless: true,
  });

  return browser;
}

/**
 * Generate PDF from HTML string
 *
 * @param html - The full HTML document string
 * @param options - Optional PDF generation options
 * @returns PDF as a Buffer
 */
export async function generatePdfFromHtml(
  html: string,
  options?: {
    subjectName?: string;
    projectName?: string;
  }
): Promise<Buffer> {
  const browser = await createBrowser();

  try {
    const page = await browser.newPage();

    // Set content and wait for everything to load
    await page.setContent(html, {
      waitUntil: ["domcontentloaded", "networkidle0"],
    });

    // Wait for fonts to be loaded using multiple strategies
    await page.evaluate(async () => {
      // Strategy 1: Wait for CSS @font-face fonts to be ready
      await document.fonts.ready;

      // Strategy 2: Force font loading by creating test elements
      const testFonts = [
        { family: 'Inter', text: 'Test ABC 123' },
        { family: 'Noto Sans Hebrew', text: 'א ב ג ד ה ו ז' }  // Hebrew aleph-zayin
      ];

      for (const { family, text } of testFonts) {
        // Create a test element that uses this font
        const testEl = document.createElement('span');
        testEl.style.fontFamily = `"${family}", sans-serif`;
        testEl.style.position = 'absolute';
        testEl.style.left = '-9999px';
        testEl.style.visibility = 'hidden';
        testEl.textContent = text;
        document.body.appendChild(testEl);

        // Force layout calculation
        void testEl.offsetWidth;

        // Check if font is loaded
        const loaded = document.fonts.check(`12px "${family}"`);
        console.log(`[PDF] Font "${family}" loaded via CSS: ${loaded}`);

        // Clean up
        testEl.remove();
      }

      // Wait again after test elements
      await document.fonts.ready;

      // Final layout recalculation
      void document.body.offsetHeight;
    });

    // Additional delay to ensure fonts are fully applied to all elements
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "50px",
        bottom: "60px",
        left: "40px",
        right: "40px",
      },
      displayHeaderFooter: true,
      // Running header for pages 2+
      // Note: Puppeteer's header/footer templates have limited styling
      // The header is hidden on the first page via CSS in the HTML
      headerTemplate: options?.subjectName && options?.projectName
        ? `
          <div style="
            width: 100%;
            font-size: 8px;
            font-weight: 500;
            color: #A1A1AA;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 0 40px;
            font-family: 'Noto Sans Hebrew', 'Inter', sans-serif;
          ">
            <span class="pageNumber"></span> | ${options.subjectName} &mdash; ${options.projectName}
          </div>
        `
        : "<div></div>",
      // Page number footer
      footerTemplate: `
        <div style="
          width: 100%;
          text-align: center;
          font-size: 8px;
          color: #A1A1AA;
          font-family: 'Noto Sans Hebrew', 'Inter', sans-serif;
          padding-bottom: 10px;
        ">
          <span class="pageNumber"></span>
        </div>
      `,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Check if Puppeteer/Chromium is available
 * Useful for graceful fallback
 */
export async function isPuppeteerAvailable(): Promise<boolean> {
  try {
    const executablePath = await chromium.executablePath(CHROMIUM_REMOTE_URL);
    return !!executablePath;
  } catch {
    return false;
  }
}
