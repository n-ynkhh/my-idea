<?php
function fetchContent($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // SSL検証を無効化
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // SSL検証を無効化
    $response = curl_exec($ch);
    curl_close($ch);
    sleep(3); // 3秒間隔
    return $response;
}

function extractLinks($html, $baseUrl) {
    $dom = new DOMDocument();
    @$dom->loadHTML($html); // エラー抑制付きでHTMLをロード
    $links = [];
    foreach ($dom->getElementsByTagName('a') as $anchor) {
        $href = $anchor->getAttribute('href');
        if (strpos($href, $baseUrl) === 0) {
            $links[] = $href;
        }
    }
    return array_unique($links); // 重複を除外
}

function getArticleUrls($baseUrl) {
    $categoriesBaseUrl = $baseUrl . '/categories';
    $sectionsBaseUrl = $baseUrl . '/sections';
    $articlesBaseUrl = $baseUrl . '/articles';
    
    // categories のリンクを取得
    $categoriesHtml = fetchContent($baseUrl);
    $categoriesLinks = extractLinks($categoriesHtml, $categoriesBaseUrl);

    $articleLinks = [];

    // sections のリンクを取得
    foreach ($categoriesLinks as $categoryLink) {
        $sectionsHtml = fetchContent($categoryLink);
        $sectionsLinks = extractLinks($sectionsHtml, $sectionsBaseUrl);

        // articles のリンクを取得
        foreach ($sectionsLinks as $sectionLink) {
            $articlesHtml = fetchContent($sectionLink);
            $articlesLinks = extractLinks($articlesHtml, $articlesBaseUrl);
            $articleLinks = array_merge($articleLinks, $articlesLinks);
        }
    }

    return array_unique($articleLinks); // 重複を除外して返す
}

// 実行部分
$baseUrl = 'https://help-test-test.jp/hc/ja';
$articleUrls = getArticleUrls($baseUrl);

// 結果を表示または保存
file_put_contents('articles_urls.txt', implode(PHP_EOL, $articleUrls));
echo "記事URL一覧を articles_urls.txt に保存しました。\n";
