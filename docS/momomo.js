const puppeteer = require('puppeteer');

// リクエスト間隔を設けるためのヘルパー関数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const baseURL = 'https://help.kaonavi.jp/hc/ja';
  const categorySelector = 'a[href^="/hc/ja/categories"]';
  const sectionSelector = 'a[href^="/hc/ja/sections"]';
  const articleSelector = 'a[href^="/hc/ja/articles"]';

  const visitedURLs = new Set(); // 既に訪問したURLを記録
  const articleURLs = new Set(); // 記事URLを格納

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // トップページにアクセスして記事URLを収集
    console.log(`Accessing: ${baseURL}`);
    await page.goto(baseURL, { waitUntil: 'networkidle2' });

    const topArticles = await page.$$eval(articleSelector, (links) =>
      links.map((link) => link.href)
    );
    topArticles.forEach((url) => articleURLs.add(url));

    console.log(`Found ${topArticles.length} articles on the top page.`);

    // カテゴリーページのリンクを収集
    const categoryLinks = await page.$$eval(categorySelector, (links) =>
      links.map((link) => link.href)
    );

    console.log(`Found ${categoryLinks.length} category links.`);

    // 各カテゴリーページを訪問
    for (const categoryLink of categoryLinks) {
      if (visitedURLs.has(categoryLink)) continue; // 既に訪問済みならスキップ
      visitedURLs.add(categoryLink);

      console.log(`Accessing category: ${categoryLink}`);
      await page.goto(categoryLink, { waitUntil: 'networkidle2' });
      await delay(3000); // サーバー負荷軽減のため3秒待機

      const categoryArticles = await page.$$eval(articleSelector, (links) =>
        links.map((link) => link.href)
      );
      categoryArticles.forEach((url) => articleURLs.add(url));

      // セクションページのリンクを収集
      const sectionLinks = await page.$$eval(sectionSelector, (links) =>
        links.map((link) => link.href)
      );

      console.log(`Found ${sectionLinks.length} section links in category: ${categoryLink}`);

      // 各セクションページを訪問
      for (const sectionLink of sectionLinks) {
        if (visitedURLs.has(sectionLink)) continue; // 既に訪問済みならスキップ
        visitedURLs.add(sectionLink);

        console.log(`Accessing section: ${sectionLink}`);
        await page.goto(sectionLink, { waitUntil: 'networkidle2' });
        await delay(3000); // サーバー負荷軽減のため3秒待機

        const sectionArticles = await page.$$eval(articleSelector, (links) =>
          links.map((link) => link.href)
        );
        sectionArticles.forEach((url) => articleURLs.add(url));
        console.log(
          `Found ${sectionArticles.length} articles in section: ${sectionLink}`
        );
      }
    }

    console.log('All unique article URLs:');
    console.log([...articleURLs]);

    // 必要ならファイルに保存
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
