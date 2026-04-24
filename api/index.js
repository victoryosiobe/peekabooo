require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-extra");
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

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const startServer = async () => {
  try {
    // Parse proxy credentials once
    const proxyUrl = new URL(
      `https://${PROXY_AUTH}@proxy.victoryosiobe.com:443`,
    );

    // Resolve executablePath once at startup.
    const executablePath = await chromium.executablePath();

    console.log("Launching browser...");
    browser = await puppeteer.launch({
      executablePath,
      args: chromium.args.concat([
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote",
        `--proxy-server=https=${proxyUrl.hostname}:${proxyUrl.port}`,
      ]),
      headless: false, //chromium.headless,
      protocolTimeout: 60000,
    });

    console.log("Browser launched:", await browser.version());

    app.get("/screenshot", async (req, res) => {
      if (!browser) return res.status(503).send("Browser not initialized.");

      const { url, width, height, fullPage } = req.query;

      if (!url || !isValidUrl(url))
        return res.status(400).send("Invalid or missing 'url'.");

      let page;
      try {
        page = await browser.newPage();

        // Authenticate with the proxy
        await page.authenticate({
          username: proxyUrl.username,
          password: proxyUrl.password,
        });

        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        );

        await page.setViewport({
          width: parseInt(width) || 1280,
          height: parseInt(height) || 720,
        });

        await page.goto(url, { waitUntil: "networkidle2", timeout: 9900 });

        const buffer = await page.screenshot({ fullPage: fullPage === "true" });

        res.set("Content-Type", "image/png");
        res.send(buffer);
      } catch (err) {
        console.error("Screenshot failed:", err);
        res.status(500).send("Failed to capture screenshot");
      } finally {
        if (page) await page.close();
      }
    });

    app.listen(3000, () => console.log("Peekabooo running on port 3000"));
  } catch (err) {
    console.error("Failed to launch browser or start server:", err);
    process.exit(1); // exit if browser launch fails, standard hosts restart the app.
  }
};

startServer();
