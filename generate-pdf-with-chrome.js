#!/usr/bin/env node

/**
 * This module exposes a function that runs Chrome, connects to it via the
 * debug protocol, then navigates to the given URL where the slides should be 
 * running, waits for Reveal to be ready then generates and returns a PDF as a
 * base 64 string.
 *
 * Which Chrome to run is auto-detected using the Chrome Launcher from the
 * Lighthouse project. Chrome is run headless if available. Chrome Canary
 * is run if available.
 *
 * Resources:
 * Getting started with Chrome Headless
 * https://developers.google.com/web/updates/2017/04/headless-chrome
 * Chrome Remote Interface Documention
 * https://chromedevtools.github.io/devtools-protocol/
 */

const chromeLauncher = require("chrome-launcher");
const chromeRemoteInterface = require("chrome-remote-interface");

async function launchChrome() {
  return chromeLauncher.launch({
    //startingUrl: 'localhost:8081',
    port: 9222,
    autoSelectChrome: true,
    chromeFlags: ["--disable-gpu", "--headless"]
  });
}

async function generatePdf(url) {
  const launcher = await launchChrome();
  const protocol = await chromeRemoteInterface();
  const { Network, Page, Runtime } = protocol;
  await Page.enable();
  await Runtime.enable();
  await Page.navigate({ url });
  await Page.loadEventFired();
  return { protocol, launcher, Page };
}

const options = {
  landscape: false,
  printBackground: true,
  // Paper size is in inches, this corresponds to A4
  paperWidth: 8.27,
  paperHeight: 11.69,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0
};

const start = async () => {
  try {
    const { protocol, launcher, Page } = await generatePdf(
      "http://localhost:8081/index.html"
    );

    setTimeout(async () => {
      const pdf = await Page.printToPDF(options);
      require("fs").writeFileSync(`cards.pdf`, pdf.data, {
        encoding: "base64"
      });
      protocol.close();
      launcher.kill();
    }, 1000);
  } catch (err) {
    console.log("💩 AieAieAie!\n", err);
  }
};

if (require.main === module) {
  require("./server.js");
  start();
  setTimeout(() => process.exit(), 5000);
}
