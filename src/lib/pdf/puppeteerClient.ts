/**
 * Puppeteer Client for PDF Generation
 *
 * Uses @sparticuz/chromium for Vercel serverless compatibility.
 * Loads custom fonts (Noto Sans Hebrew, Inter) for Hebrew/Latin text support.
 */

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import fs from "fs";

// @sparticuz/chromium has a font() method that isn't in the TypeScript types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chromiumWithFonts = chromium as typeof chromium & {
  font: (fontPath: string) => Promise<void>;
};

// Disable WebGL for faster startup in serverless
chromium.setGraphicsMode = false;

/**
 * Get the path to font files
 * In production (Vercel), fonts are in the public folder
 * In development, they're accessible via file system
 */
function getFontPath(fontName: string): string {
  // Check common locations
  const possiblePaths = [
    path.join(process.cwd(), "public", "fonts", fontName),
    path.join(process.cwd(), ".next", "static", "fonts", fontName),
    path.join("/var/task", "public", "fonts", fontName), // Vercel serverless
  ];

  for (const fontPath of possiblePaths) {
    if (fs.existsSync(fontPath)) {
      return fontPath;
    }
  }

  // Default to public/fonts
  return path.join(process.cwd(), "public", "fonts", fontName);
}

/**
 * Load custom fonts into Chromium
 * This is required for Hebrew text rendering
 */
async function loadFonts(): Promise<void> {
  const fonts = [
    "NotoSansHebrew-Regular.ttf",
    "NotoSansHebrew-Bold.ttf",
    "Inter-Regular.ttf",
    "Inter-Medium.ttf",
    "Inter-Bold.ttf",
  ];

  for (const font of fonts) {
    const fontPath = getFontPath(font);
    if (fs.existsSync(fontPath)) {
      try {
        await chromiumWithFonts.font(fontPath);
      } catch (error) {
        console.warn(`[PDF] Warning: Could not load font ${font}:`, error);
      }
    } else {
      console.warn(`[PDF] Warning: Font file not found: ${fontPath}`);
    }
  }
}

/**
 * Create a Puppeteer browser instance
 * Configured for Vercel serverless environment
 */
async function createBrowser(): Promise<ReturnType<typeof puppeteer.launch>> {
  // Load custom fonts before launching browser (only in production)
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    await loadFonts();
  }

  // Use local Chrome in development, @sparticuz/chromium in production
  const executablePath = isDev
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : await chromium.executablePath();

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

    // Wait for fonts to be loaded
    await page.evaluateHandle("document.fonts.ready");

    // Small delay to ensure fonts are applied
    await new Promise((resolve) => setTimeout(resolve, 100));

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
    const executablePath = await chromium.executablePath();
    return !!executablePath;
  } catch {
    return false;
  }
}
