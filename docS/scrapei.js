const puppeteer = require('puppeteer');

// 間隔を空けるためのヘルパー関数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const baseURL = 'https://help.kaonavi.jp/hc/ja';
  const categorySelector = 'a[href^="/hc/ja/categories"]';
  const sectionSelector = 'a[href^="/hc/ja/sections"]';
  const articleSelector = 'a[href^="/hc/ja/articles"]';
  
  const visitedURLs = new Set(); // 既に訪問したURLを記録
  const articleURLs = new Set(); // 記事URLを格納

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    // トップページにアクセス
    await page.goto(baseURL, { waitUntil: 'networkidle2' });
    console.log(`Accessing: ${baseURL}`);

    // カテゴリページのリンクを取得
    const categoryLinks = await page.$$eval(categorySelector, (links) =>
      links.map((link) => link.href)
    );

    for (const categoryLink of categoryLinks) {
      if (visitedURLs.has(categoryLink)) continue; // 既に訪問済みならスキップ
      visitedURLs.add(categoryLink);

      // カテゴリページにアクセス
      console.log(`Accessing category: ${categoryLink}`);
      await page.goto(categoryLink, { waitUntil: 'networkidle2' });
      await delay(3000); // 3秒待機

      // セクションページのリンクを取得
      const sectionLinks = await page.$$eval(sectionSelector, (links) =>
        links.map((link) => link.href)
      );

      for (const sectionLink of sectionLinks) {
        if (visitedURLs.has(sectionLink)) continue; // 既に訪問済みならスキップ
        visitedURLs.add(sectionLink);

        // セクションページにアクセス
        console.log(`Accessing section: ${sectionLink}`);
        await page.goto(sectionLink, { waitUntil: 'networkidle2' });
        await delay(3000); // 3秒待機

        // 記事ページのリンクを取得
        const articleLinks = await page.$$eval(articleSelector, (links) =>
          links.map((link) => link.href)
        );

        for (const articleLink of articleLinks) {
          articleURLs.add(articleLink); // 記事URLをセットに追加
        }
      }
    }

    console.log('Collected article URLs:');
    console.log([...articleURLs]);

    // ファイル保存（必要なら以下のコードを有効化）
    /*
    const fs = require('fs');
    fs.writeFileSync('article_urls.txt', [...articleURLs].join('\n'), 'utf-8');
    console.log('Article URLs saved to article_urls.txt');
    */
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
