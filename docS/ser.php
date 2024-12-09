<?php
// トップURL
$baseUrl = "https://help-test-test.jp/hc/ja/";

// 重複確認用
$visited = [
    'categories' => [],
    'sections'   => [],
    'articles'   => []
];

// 取得した記事URLを格納する配列
$articles = [];

// ページ取得用関数（cURLでSSL検証回避）
// リクエスト前に3秒スリープ
function fetchPage($url) {
    // 3秒待機
    sleep(3);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // SSL検証回避
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

    $html = curl_exec($ch);
    curl_close($ch);
    return $html;
}

// HTMLから指定パターンにマッチするaタグ抽出用関数(DOMDocument利用)
function extractLinks($html, $baseUrl, $pattern) {
    $dom = new DOMDocument();
    @$dom->loadHTML($html);
    $links = [];
    foreach ($dom->getElementsByTagName('a') as $a) {
        $href = $a->getAttribute('href');
        if (preg_match($pattern, $href)) {
            // 絶対URL化
            $fullUrl = (strpos($href, 'http') === 0) ? $href : rtrim($baseUrl, '/') . '/' . ltrim($href, '/');
            $links[] = $fullUrl;
        }
    }
    return array_unique($links);
}

// トップページからcategoriesリンク取得
$topHtml = fetchPage($baseUrl);
$categoryLinks = extractLinks($topHtml, $baseUrl, '#^/hc/ja/categories#');

foreach ($categoryLinks as $categoryUrl) {
    if (isset($visited['categories'][$categoryUrl])) {
        continue;
    }
    $visited['categories'][$categoryUrl] = true;
    
    $catHtml = fetchPage($categoryUrl);
    // カテゴリページからセクションリンク抽出
    $sectionLinks = extractLinks($catHtml, $baseUrl, '#^/hc/ja/sections#');
    
    foreach ($sectionLinks as $sectionUrl) {
        if (isset($visited['sections'][$sectionUrl])) {
            continue;
        }
        $visited['sections'][$sectionUrl] = true;
        
        $secHtml = fetchPage($sectionUrl);
        // セクションページから記事リンク抽出
        $articleLinks = extractLinks($secHtml, $baseUrl, '#^/hc/ja/articles#');
        
        foreach ($articleLinks as $articleUrl) {
            if (!isset($visited['articles'][$articleUrl])) {
                $visited['articles'][$articleUrl] = true;
                $articles[] = $articleUrl;
            }
        }
    }
}

// 重複を除去
$articles = array_unique($articles);

// 取得結果出力
foreach ($articles as $article) {
    echo $article . PHP_EOL;
}
