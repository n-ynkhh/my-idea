const fs = require('fs');
const puppeteer = require('puppeteer');

// ファイルからURLを読み込む
const readUrlsFromFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return data.split('\n').filter((line) => line.trim() !== '');
  } catch (error) {
    console.error(`Failed to read file: ${filePath}`, error);
    return [];
  }
};

// HTMLを保存する
const saveHtmlToFile = (fileName, html) => {
  try {
    fs.writeFileSync(fileName, html, 'utf-8');
    console.log(`Saved: ${fileName}`);
  } catch (error) {
    console.error(`Failed to save file: ${fileName}`, error);
  }
};

(async () => {
  const urls = readUrlsFromFile('article_urls.txt'); // URL一覧ファイル
  if (urls.length === 0) {
    console.error('No URLs found in article_urls.txt.');
    return;
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    for (const url of urls) {
      console.log(`Accessing: ${url}`);
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const html = await page.content(); // ページのHTMLコンテンツを取得

        // ファイル名をURLの末尾（記事ID）から生成
        const fileName = `html/${url.split('/').pop()}.html`;
        saveHtmlToFile(fileName, html);

        // サーバー負荷軽減のため3秒待機
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Failed to access or save: ${url}`, error);
      }
    }
  } catch (error) {
    console.error('Error during processing:', error);
  } finally {
    await browser.close();
  }
})();
