const puppeteer = require('puppeteer');

// Helper function to delay requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const baseURL = 'https://help.kaonavi.jp/hc/ja';
  const categorySelector = 'a[href^="/hc/ja/categories"]';
  const sectionSelector = 'a[href^="/hc/ja/sections"]';
  const articleSelector = 'a[href^="/hc/ja/articles"]';
  const paginationLastSelector = 'a.pagination-last-link'; // 最終ページリンクのセレクタ

  const visitedURLs = new Set(); // Track visited URLs
  const articleURLs = new Set(); // Collect article URLs

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Scrape all pages in a paginated section
  const scrapePaginatedSection = async (url) => {
    let currentPage = url;
    let totalPages = 1;

    console.log(`Accessing section with pagination: ${url}`);
    try {
      // Determine the total number of pages by inspecting the "last page" link
      await page.goto(url, { waitUntil: 'networkidle2' });
      await delay(3000);

      const lastPageLink = await page.$eval(paginationLastSelector, (link) => link.href).catch(() => null);
      if (lastPageLink && /\?page=(\d+)/.test(lastPageLink)) {
        totalPages = parseInt(lastPageLink.match(/\?page=(\d+)/)[1], 10);
        console.log(`Total pages found: ${totalPages}`);
      }

      // Iterate through all pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageURL = `${url}?page=${pageNum}`;
        if (visitedURLs.has(pageURL)) continue;
        visitedURLs.add(pageURL);

        console.log(`Accessing: ${pageURL}`);
        await page.goto(pageURL, { waitUntil: 'networkidle2' });
        await delay(3000);

        // Collect articles on the current page
        const articles = await page.$$eval(articleSelector, (links) =>
          links.map((link) => link.href)
        );
        articles.forEach((url) => articleURLs.add(url));
        console.log(`Found ${articles.length} articles on: ${pageURL}`);
      }
    } catch (error) {
      console.error(`Failed to process paginated section: ${url}`, error);
    }
  };

  // Recursive function to scrape categories and sections
  const scrapePage = async (url) => {
    if (visitedURLs.has(url)) return;
    visitedURLs.add(url);

    console.log(`Accessing: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await delay(3000);

      // Collect articles on the current page
      const articles = await page.$$eval(articleSelector, (links) =>
        links.map((link) => link.href)
      );
      articles.forEach((url) => articleURLs.add(url));

      console.log(`Found ${articles.length} articles on: ${url}`);

      // Collect and recursively process category links
      const categoryLinks = await page.$$eval(categorySelector, (links) =>
        links.map((link) => link.href)
      );
      for (const link of categoryLinks) {
        await scrapePage(link);
      }

      // Collect and recursively process section links
      const sectionLinks = await page.$$eval(sectionSelector, (links) =>
        links.map((link) => link.href)
      );
      for (const link of sectionLinks) {
        await scrapePaginatedSection(link);
      }
    } catch (error) {
      console.error(`Failed to process page: ${url}`, error);
    }
  };

  try {
    // Start scraping from the base URL
    await scrapePage(baseURL);

    console.log('All unique article URLs:');
    console.log([...articleURLs]);

    // Optionally save results to a file
    const fs = require('fs');
    fs.writeFileSync('article_urls.txt', [...articleURLs].join('\n'), 'utf-8');
    console.log('Article URLs saved to article_urls.txt');
  } catch (error) {
    console.error('Error during processing:', error);
  } finally {
    await browser.close();
  }
})();
