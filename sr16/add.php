<?php
// 設定
$knowledgeId = "YOUR_KNOWLEDGE_ID";
$apiToken = "YOUR_API_TOKEN"; 
$apiBaseUrl = "https://api.dify.example.com/knowledges/$knowledgeId/documents";
$htmlDir = __DIR__ . "/html";
$listFile = __DIR__ . "/list.txt";

// list.txtから対象ドキュメントリスト取得
$listDocs = file($listFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if ($listDocs === false) {
    die("Failed to read list.txt\n");
}

// htmlディレクトリにあるファイル一覧取得
$files = scandir($htmlDir);
if ($files === false) {
    die("Failed to read html directory\n");
}

// list.txtに記載されているファイルがhtmlディレクトリに存在するか確認しつつ登録
$registeredDocs = [];
foreach ($listDocs as $docName) {
    $filePath = $htmlDir . "/" . $docName;
    if (!file_exists($filePath)) {
        echo "File $docName not found in html directory, skipping.\n";
        continue;
    }
    $content = file_get_contents($filePath);
    if ($content === false) {
        echo "Failed to read $docName\n";
        continue;
    }

    // ドキュメント登録
    $postData = [
        "title" => $docName,
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
        // 登録成功と仮定（実際はレスポンスJSONをパースしてID取得など行う）
        // ここでは単純化のためdocNameを配列に入れる
        $registeredDocs[] = $docName;
        echo "Registered: $docName\n";
    } else {
        echo "Failed to register $docName. HTTP Code: $httpCode\n";
    }
}

// 登録が完了した後、同じナレッジIDでドキュメント一覧取得
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
if (!isset($data['documents'])) {
    die("Invalid response: 'documents' not found.\n");
}

$docsFromServer = $data['documents'];
echo "Total documents on server: " . count($docsFromServer) . "\n";
echo "Documents in list.txt: " . count($listDocs) . "\n";

// list.txtの行数とサーバー上のドキュメント数が一致するか確認
if (count($docsFromServer) !== count($listDocs)) {
    echo "Mismatch in document count. list.txt: " . count($listDocs) . ", Server: " . count($docsFromServer) . "\n";
} else {
    echo "Document count matches.\n";
}

// 全てがindexedされるまで10秒おきにチェック
$maxRetries = 6; // 最大6回、つまり最大60秒待つ
$allIndexed = false;

for ($i = 0; $i < $maxRetries; $i++) {
    // 最新状態を取得
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
    if (!isset($data['documents'])) {
        echo "Invalid response on retry.\n";
        break;
    }

    $docsFromServer = $data['documents'];

    // 全ドキュメントがindexedかチェック
    $notIndexed = array_filter($docsFromServer, function($doc) {
        return $doc['status'] !== 'indexed';
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
