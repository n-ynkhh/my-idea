const puppeteer = require('puppeteer');

// リクエスト間隔を設けるためのヘルパー関数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const baseURL = 'https://help.kaonavi.jp/hc/ja';
  const categorySelector = 'a[href^="/hc/ja/categories"]';
  const sectionSelector = 'a[href^="/hc/ja/sections"]';
  const articleSelector = 'a[href^="/hc/ja/articles"]';
  const paginationLastSelector = 'a.pagination-last-link'; // 最終ページリンクのセレクタ

  const visitedURLs = new Set(); // 訪問済みのURLを記録
  const articleURLs = new Set(); // 記事URLを格納

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

  // ページネーションが存在するセクションページを処理する関数
  const scrapePaginatedSection = async (url) => {
    if (visitedURLs.has(url)) return; // 訪問済みならスキップ
    visitedURLs.add(url);

    console.log(`セクションページを処理中: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await delay(3000);

      // 最終ページを確認
      const lastPageLink = await page.$eval(paginationLastSelector, (link) => link.href).catch(() => null);
      let totalPages = 1;
      if (lastPageLink && /\?page=(\d+)/.test(lastPageLink)) {
        totalPages = parseInt(lastPageLink.match(/\?page=(\d+)/)[1], 10);
        console.log(`ページ数: ${totalPages}`);
      }

      // 各ページを巡回
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageURL = `${url}?page=${pageNum}`;
        if (visitedURLs.has(pageURL)) continue; // 訪問済みならスキップ
        visitedURLs.add(pageURL);

        console.log(`ページを処理中: ${pageURL}`);
        await page.goto(pageURL, { waitUntil: 'networkidle2' });
        await delay(3000);

        // 記事URLを収集
        const articles = await page.$$eval(articleSelector, (links) =>
          links.map((link) => link.href)
        );
        articles.forEach((url) => articleURLs.add(url));
        console.log(`記事数: ${articles.length} (ページ: ${pageNum})`);
      }
    } catch (error) {
      console.error(`セクションページの処理に失敗: ${url}`, error);
    }
  };

  // カテゴリおよびセクションページを再帰的に処理する関数
  const scrapePage = async (url) => {
    if (visitedURLs.has(url)) return; // 訪問済みならスキップ
    visitedURLs.add(url);

    console.log(`ページを処理中: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await delay(3000);

      // 記事URLを収集
      const articles = await page.$$eval(articleSelector, (links) =>
        links.map((link) => link.href)
      );
      articles.forEach((url) => articleURLs.add(url));
      console.log(`記事数: ${articles.length}`);

      // カテゴリリンクを再帰的に処理
      const categoryLinks = await page.$$eval(categorySelector, (links) =>
        links.map((link) => link.href)
      );
      console.log(`カテゴリリンク数: ${categoryLinks.length}`);
      for (const link of categoryLinks) {
        await scrapePage(link);
      }

      // セクションリンクを収集して処理
      const sectionLinks = await page.$$eval(sectionSelector, (links) =>
        links.map((link) => link.href)
      );
      console.log(`セクションリンク数: ${sectionLinks.length}`);
      for (const link of sectionLinks) {
        await scrapePaginatedSection(link);
      }

      // すべてのリンクを再確認して漏れを防ぐ
      const additionalLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/hc/ja/"]'))
          .map(link => link.href);
      });

      for (const link of additionalLinks) {
        if (link.includes('/hc/ja/sections') && !visitedURLs.has(link)) {
          console.log(`追加セクションリンクを発見: ${link}`);
          await scrapePaginatedSection(link);
        } else if (link.includes('/hc/ja/categories') && !visitedURLs.has(link)) {
          console.log(`追加カテゴリリンクを発見: ${link}`);
          await scrapePage(link);
        }
      }

    } catch (error) {
      console.error(`ページの処理に失敗: ${url}`, error);
    }
  };

  try {
    // トップページからスクレイピング開始
    await scrapePage(baseURL);

    console.log('収集した全ての記事URL:');
    console.log([...articleURLs]);

    // 結果をファイルに保存
    const fs = require('fs');
    fs.writeFileSync('article_urls.txt', [...articleURLs].join('\n'), 'utf-8');
    console.log('記事URLを article_urls.txt に保存しました');
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();
