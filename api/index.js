const express = require("express");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const cors = require("cors");

const app = express();
app.use(cors()); // Enable CORS for all routes

let browser;

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

app.get("/screenshot", async (req, res) => {
  if (!browser) return res.status(503).send("Browser not initialized.");

  const page = await browser.newPage();
  try {
    const { url, width, height } = req.query;
    const isValidUrl = (str) => {
      try {
        new URL(str);
        return true;
      } catch {
        return false;
      }
    };
    if (!url || !isValidUrl(url))
      return res.status(400).send("Invalid or missing 'url'");

    await page.setViewport({
      width: parseInt(width) || 1280,
      height: parseInt(height) || 720,
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 8000 });

    const buffer = await page.screenshot({ fullPage: false });

    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("Screenshot failed:", err);
    res.status(500).send("Failed to capture screenshot");
  } finally {
    await page.close();
  }
});

app.listen(3000, () => console.log("🚀 Peekaboo running on port 3000"));
