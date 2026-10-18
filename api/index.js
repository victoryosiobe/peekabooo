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

const REQUIRED_ENV_VARS = ["PROXY_AUTH", "PROXY_URL", "PROXY_PORT"];

REQUIRED_ENV_VARS.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(
      `WARNING: No ${envVar} set. Ensure variable is set in your environment. ` +
        `Script will run but fail to function properly.`,
    );
  }
});

const PROXY_AUTH = process.env.PROXY_AUTH;
const PROXY_URL = process.env.PROXY_URL;
const PROXY_PORT = process.env.PROXY_PORT;

// Stealth setup
const pp = StealthPlugin();
pp.enabledEvasions.delete("iframe.contentWindow");
pp.enabledEvasions.delete("media.codecs");
puppeteer.use(pp);

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const proxyUrl = new URL(`https://${PROXY_AUTH}@${PROXY_URL}:${PROXY_PORT}`);

let browserPromise = null;

const launchBrowser = async () => {
  const executablePath = await chromium.executablePath();

  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args.concat([
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--single-process",
      "--no-zygote",
      "--ignore-certificate-errors",
      `--proxy-server=${PROXY_URL}:${PROXY_PORT}`,
    ]),
    headless: chromium.headless,
    protocolTimeout: 60 * 1000,
  });

  browser.on("disconnected", () => {
    console.error("Browser disconnected, will relaunch on next request");
    browserPromise = null;
  });

  console.log("Browser launched:", await browser.version());
  return browser;
};

const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = launchBrowser().catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
};

app.get("/screenshot", async (req, res) => {
  const { url, width, height, fullPage } = req.query;

  if (!url || !isValidUrl(url))
    return res.status(400).send("Bad Request: Invalid or missing 'url'.");

  if (isNotAllowedUrl(url))
    return res.status(403).send("Blocked Access: Forbidden resource.");

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    page.on("error", (err) => console.error("Page crashed:", url, err));
    page.on("requestfailed", (r) =>
      console.error("Request failed:", r.url(), r.failure()?.errorText),
    );

    await page.authenticate({
      username: proxyUrl.username,
      password: proxyUrl.password,
    });

    await page.setViewport({
      width: parseInt(width) || 1280,
      height: parseInt(height) || 720,
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20 * 1000 });

    // some web pages rarely go fully idle, so stop after 5s
    await page
      .waitForNetworkIdle({ idleTime: 1000, timeout: 5000 })
      .catch(() => {});

    const buffer = await page.screenshot({ fullPage: fullPage === "true" });

    res.set("Content-Type", "image/png");
    res.end(buffer);
  } catch (err) {
    console.error("Screenshot failed:", url, err);
    if (!res.headersSent) res.status(500).send("Failed to capture screenshot");
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

app.listen(3000, () => console.log("Peekabooo running on port 3000"));
