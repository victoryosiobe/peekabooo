require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-extra");
const proxyChain = require("proxy-chain");
const PROXY_AUTH = process.env.PROXY_AUTH;

// Add the Imports before StealthPlugin
require("puppeteer-extra-plugin-stealth/evasions/chrome.app");
require("puppeteer-extra-plugin-stealth/evasions/chrome.csi");
require("puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes");
require("puppeteer-extra-plugin-stealth/evasions/chrome.runtime");
require("puppeteer-extra-plugin-stealth/evasions/defaultArgs");
require("puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow");
require("puppeteer-extra-plugin-stealth/evasions/media.codecs");
require("puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency");
require("puppeteer-extra-plugin-stealth/evasions/navigator.languages");
require("puppeteer-extra-plugin-stealth/evasions/navigator.permissions");
require("puppeteer-extra-plugin-stealth/evasions/navigator.plugins");
require("puppeteer-extra-plugin-stealth/evasions/navigator.vendor");
require("puppeteer-extra-plugin-stealth/evasions/navigator.webdriver");
require("puppeteer-extra-plugin-stealth/evasions/sourceurl");
require("puppeteer-extra-plugin-stealth/evasions/user-agent-override");
require("puppeteer-extra-plugin-stealth/evasions/webgl.vendor");
require("puppeteer-extra-plugin-stealth/evasions/window.outerdimensions");
require("puppeteer-extra-plugin-user-preferences");
require("puppeteer-extra-plugin-user-data-dir");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const pp = StealthPlugin();
pp.enabledEvasions.delete("iframe.contentWindow");
pp.enabledEvasions.delete("media.codecs");
puppeteer.use(pp);

let browser;

const startServer = async () => {
  try {
    const anonymized = await proxyChain.anonymizeProxy(
      `https://${PROXY_AUTH}@proxy.victoryosiobe.com`,
    );

    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args.concat([
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote",
        `--proxy-server=${anonymized}`,
      ]),
      headless: false, //chromium.headless,
      protocolTimeout: 60000,
    });

    console.log("🧠 Browser launched:", await browser.version());

    app.get("/screenshot", async (req, res) => {
      if (!browser) return res.status(503).send("Browser not initialized.");

      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      );

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

        await page.goto(url, { waitUntil: "networkidle2", timeout: 8000 });

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
  } catch (err) {
    console.error("💥 Failed to launch browser or start server:", err);
    process.exit(1); // Optional: exit if browser launch fails
  }
};

startServer();
