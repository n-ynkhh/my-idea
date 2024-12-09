npm install puppeteer



const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://help.kaonavi.jp/hc/ja');
  const content = await page.content();
  console.log(content);
  await browser.close();
})();


node fetch_page.js
