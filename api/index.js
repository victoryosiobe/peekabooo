const express = require("express");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const app = express();

app.get("/screenshot", async (req, res) => {
  const { url, width, height } = req.query;

  // Basic URL validation helper
  function isValidUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  if (!url || !isValidUrl(url)) {
    return res.status(400).send("Invalid or missing 'url' parameter");
  }

  const viewportWidth = parseInt(width);
  const viewportHeight = parseInt(height);

  if ((width && isNaN(viewportWidth)) || (height && isNaN(viewportHeight))) {
    return res.status(400).send("Invalid 'width' or 'height' parameter");
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args.concat([
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote",
      ]),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: viewportWidth || 1280,
      height: viewportHeight || 720,
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 8000 });

    const buffer = await page.screenshot({ fullPage: false });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("Screenshot failed:", err);
    res.status(500).send("Failed to capture screenshot", err);
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(3000, () => console.log("🚀 Peekaboo running on port 3000"));
