const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true, // ヘッドレスモードを有効化
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  // ユーザーエージェント設定
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
  );
  
  // ウィンドウサイズ設定
  await page.setViewport({ width: 1920, height: 1080 });

  // ヘッドレス検出回避
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    const url = 'https://help.kaonavi.jp/hc/ja';
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('a[href^="/hc/ja/categories"]');

    console.log('Page loaded successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
