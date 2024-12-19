<?php
// 設定
$knowledgeId = "YOUR_KNOWLEDGE_ID";
$apiToken = "YOUR_API_TOKEN";
$apiBaseUrl = "https://api.dify.ai/v1/knowledge_bases/$knowledgeId/documents";
$htmlDir = __DIR__ . "/html";
$listFile = __DIR__ . "/list.txt";

// list.txtから行数（=期待ドキュメント数）を取得
$listDocs = file($listFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if ($listDocs === false) {
    die("Failed to read list.txt\n");
}
$expectedCount = count($listDocs);

// htmlディレクトリから全ての.htmlファイルを取得
$files = scandir($htmlDir);
if ($files === false) {
    die("Failed to read html directory\n");
}

// .htmlファイルのみフィルタリング
$htmlFiles = array_filter($files, function($f) use ($htmlDir) {
    return is_file($htmlDir . '/' . $f) && strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'html';
});

// ドキュメントを登録（ここではファイル数分POSTを行う）
// 注意: 実際のDify APIのパラメータは必ず最新のドキュメントを確認して修正してください。
foreach ($htmlFiles as $docName) {
    $filePath = $htmlDir . "/" . $docName;
    $content = file_get_contents($filePath);
    if ($content === false) {
        echo "Failed to read $docName, skipping.\n";
        continue;
    }

    // 必要に応じてHTML->TEXT変換
    // $content = strip_tags($content);

    $postData = [
        "data_source_type" => "file",
        "metadata" => [
            "title" => $docName,
        ],
        "content" => $content
    ];

    $ch = curl_init($apiBaseUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData, JSON_UNESCAPED_UNICODE));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiToken",
        "Content-Type: application/json"
    ]);
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        echo "cURL Error: " . curl_error($ch) . "\n";
        curl_close($ch);
        continue;
    }
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201 || $httpCode === 200) {
        echo "Registered: $docName\n";
    } else {
        echo "Failed to register $docName. HTTP Code: $httpCode\n";
        echo "Response: $response\n";
    }
}

// 登録後に一覧取得
$ch = curl_init($apiBaseUrl);
curl_setopt($ch, CURLOPT_HTTPGET, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $apiToken"
]);
$response = curl_exec($ch);
if (curl_errno($ch)) {
    die("cURL Error: " . curl_error($ch) . "\n");
}
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    die("Failed to get documents list. HTTP Code: $httpCode\n");
}

$data = json_decode($response, true);
if (!isset($data['data'])) {
    die("Invalid response: 'data' not found.\n");
}

$docsFromServer = $data['data'];
$serverCount = count($docsFromServer);

echo "Total documents on server: $serverCount\n";
echo "Documents expected (list.txt lines): $expectedCount\n";

// list.txtの行数とサーバー上のドキュメント数が一致するか確認
if ($serverCount !== $expectedCount) {
    echo "Mismatch in document count. list.txt: $expectedCount, Server: $serverCount\n";
} else {
    echo "Document count matches.\n";
}

// 全てがindexed状態になるまで10秒おきにチェック
$maxRetries = 6; // 最大6回、つまり最大60秒待つ
$allIndexed = false;

for ($i = 0; $i < $maxRetries; $i++) {
    $ch = curl_init($apiBaseUrl);
    curl_setopt($ch, CURLOPT_HTTPGET, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiToken"
    ]);
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        echo "cURL Error: " . curl_error($ch) . "\n";
        break;
    }
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        echo "Failed to get documents list on retry.\n";
        break;
    }

    $data = json_decode($response, true);
    if (!isset($data['data'])) {
        echo "Invalid response on retry.\n";
        break;
    }

    $docsFromServer = $data['data'];

    // 全ドキュメントがindexedかチェック
    $notIndexed = array_filter($docsFromServer, function($doc) {
        return isset($doc['status']) && $doc['status'] !== 'indexed';
    });

    if (count($notIndexed) === 0) {
        $allIndexed = true;
        echo "All documents are indexed and available.\n";
        break;
    } else {
        echo "Some documents are not yet indexed. Waiting 10 seconds...\n";
        sleep(10);
    }
}

if (!$allIndexed) {
    echo "Not all documents indexed within the expected time.\n";
}

echo "Process completed.\n";
