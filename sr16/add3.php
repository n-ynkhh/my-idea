<?php
// 設定
$datasetId = "YOUR_DATASET_ID";
$apiToken = "YOUR_API_TOKEN";
$createByFileUrl = "https://api.dify.ai/v1/datasets/$datasetId/documents/create_by_file";
$listFile = __DIR__ . "/list.txt";
$htmlDir = __DIR__ . "/html";
$chunkSize = 100; // 一度に送信するファイル数

// list.txtから期待ドキュメント数を取得（行数）
$listDocs = file($listFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if ($listDocs === false) {
    die("Failed to read list.txt\n");
}
$expectedCount = count($listDocs);

// htmlディレクトリから.htmlファイル一覧取得
$files = scandir($htmlDir);
if ($files === false) {
    die("Failed to read html directory\n");
}
$htmlFiles = array_filter($files, function($f) use ($htmlDir) {
    return is_file($htmlDir . '/' . $f) && strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'html';
});
$htmlFiles = array_values($htmlFiles); // インデックスを詰めなおす

if (empty($htmlFiles)) {
    die("No .html files found in html directory.\n");
}

// ファイルをチャンクに分割
$fileChunks = array_chunk($htmlFiles, $chunkSize);

// 各チャンクごとにPOSTリクエスト
foreach ($fileChunks as $index => $chunk) {
    echo "Uploading chunk " . ($index + 1) . "/" . count($fileChunks) . " with " . count($chunk) . " files...\n";
    
    // multipart/form-data用のデータを構築
    // 複数ファイルを送る場合、同じ"name"で配列的に送信できるかはAPIの仕様によりますが、
    // ここでは同じ"name"を使って複数のファイルを送信することを想定しています。
    // 必要であれば'name'を別々にする、もしくはAPIドキュメントに従った送信形式に修正してください。
    $postFields = [];
    foreach ($chunk as $f) {
        $filePath = $htmlDir . "/" . $f;
        $postFields['file[]'] = new CURLFile($filePath, mime_content_type($filePath), $f);
    }

    $ch = curl_init($createByFileUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiToken"
    ]);
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        echo "cURL Error: " . curl_error($ch) . "\n";
        curl_close($ch);
        continue;
    }
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        echo "Chunk " . ($index + 1) . " uploaded successfully.\n";
    } else {
        echo "Failed to upload chunk " . ($index + 1) . ". HTTP Code: $httpCode\n";
        echo "Response: $response\n";
    }
}

// 登録後の確認: ドキュメント一覧を取得して件数とインデックス状態を確認
$getListUrl = "https://api.dify.ai/v1/datasets/$datasetId/documents";
$ch = curl_init($getListUrl);
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

if ($serverCount !== $expectedCount) {
    echo "Mismatch in document count. Expected: $expectedCount, Server: $serverCount\n";
} else {
    echo "Document count matches.\n";
}

// 全てのドキュメントがreadyになるまで10秒おきにチェック
$maxRetries = 6; // 最大6回(60秒)
$allReady = false;

for ($i = 0; $i < $maxRetries; $i++) {
    $ch = curl_init($getListUrl);
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
    $notReady = array_filter($docsFromServer, function($doc) {
        return isset($doc['status']) && $doc['status'] !== 'ready';
    });

    if (count($notReady) === 0) {
        $allReady = true;
        echo "All documents are indexed (ready) and available.\n";
        break;
    } else {
        echo "Some documents are not yet ready. Waiting 10 seconds...\n";
        sleep(10);
    }
}

if (!$allReady) {
    echo "Not all documents ready within the expected time.\n";
}

echo "Process completed.\n";
