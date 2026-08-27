import dotenv from "dotenv";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";
import { addExtra } from "puppeteer-extra";

// These MUST be imported BEFORE StealthPlugin.
import "puppeteer-extra-plugin-stealth/evasions/chrome.app/index.js";
import "puppeteer-extra-plugin-stealth/evasions/chrome.csi/index.js";
import "puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes/index.js";
import "puppeteer-extra-plugin-stealth/evasions/chrome.runtime/index.js";
import "puppeteer-extra-plugin-stealth/evasions/defaultArgs/index.js";
import "puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow/index.js";
import "puppeteer-extra-plugin-stealth/evasions/media.codecs/index.js";
import "puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency/index.js";
import "puppeteer-extra-plugin-stealth/evasions/navigator.languages/index.js";
import "puppeteer-extra-plugin-stealth/evasions/navigator.permissions/index.js";
import "puppeteer-extra-plugin-stealth/evasions/navigator.plugins/index.js";
import "puppeteer-extra-plugin-stealth/evasions/navigator.vendor/index.js";
import "puppeteer-extra-plugin-stealth/evasions/navigator.webdriver/index.js";
import "puppeteer-extra-plugin-stealth/evasions/sourceurl/index.js";
import "puppeteer-extra-plugin-stealth/evasions/user-agent-override/index.js";
import "puppeteer-extra-plugin-stealth/evasions/webgl.vendor/index.js";
import "puppeteer-extra-plugin-stealth/evasions/window.outerdimensions/index.js";

import StealthPlugin from "puppeteer-extra-plugin-stealth";
import "puppeteer-extra-plugin-user-preferences";
import "puppeteer-extra-plugin-user-data-dir";

import { isNotAllowedUrl } from "../scripts/utils.js";

dotenv.config({ quiet: true });

// 2. Bind ESM puppeteer-core to puppeteer-extra
const puppeteer = addExtra(puppeteerCore);

// Reconstruct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "..", "public")));

const PROXY_AUTH = process.env.PROXY_AUTH;
if (!PROXY_AUTH) {
  console.warn(
    "WARNING: No proxy auth set, ensure variable is set in your environment. Script will run but fail function."
  );
}

// Stealth setup
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
    const proxyUrl = new URL(
      `https://${PROXY_AUTH}@proxy.victoryosiobe.com:1080`
    );

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
        "--ignore-certificate-errors",
        `--proxy-server=https=${proxyUrl.hostname}:${proxyUrl.port}`,
      ]),
      headless: chromium.headless,
      protocolTimeout: 3 * 60 * 1000,
    });

    console.log("Browser launched:", await browser.version());

    app.get("/screenshot", async (req, res) => {
      if (!browser) return res.status(503).send("Browser not initialized.");

      const { url, width, height, fullPage } = req.query;

      if (!url || !isValidUrl(url))
        return res.status(400).send("Bad Request: Invalid or missing 'url'.");

      if (isNotAllowedUrl(url))
        return res.status(403).send("Blocked Access: Forbidden resource.");

      let page;
      try {
        page = await browser.newPage();

        await page.authenticate({
          username: proxyUrl.username,
          password: proxyUrl.password,
        });

        await page.setViewport({
          width: parseInt(width) || 1280,
          height: parseInt(height) || 720,
        });

        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 3 * 60 * 1000,
        });

        const buffer = await page.screenshot({ fullPage: fullPage === "true" });

        res.set("Content-Type", "image/png");
        res.end(buffer);
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
    process.exit(1);
  }
};

startServer();
