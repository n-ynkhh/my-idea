const fs = require('fs');
const path = require('path');

// 対象ディレクトリのパス（必要に応じて変更）
const targetDir = './target_directory';

// ディレクトリ内のファイル一覧を取得
fs.readdir(targetDir, (err, files) => {
  if (err) {
    console.error('ディレクトリの読み込みに失敗しました:', err);
    return;
  }

  files.forEach(file => {
    // ファイル名が "-" で終わっているかを判定
    if (file.endsWith('-')) {
      const oldPath = path.join(targetDir, file);
      const newName = file.slice(0, -1); // 末尾の "-" を削除
      const newPath = path.join(targetDir, newName);

      // リネーム処理
      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          console.error(`"${file}" のリネームに失敗:`, err);
        } else {
          console.log(`"${file}" → "${newName}" にリネームしました`);
        }
      });
    }
  });
});
