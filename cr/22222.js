const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 暗号化関数
const encrypt = (data, key) => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// 対象ディレクトリと出力ディレクトリのパス
const inputDir = './input_json';  // JSONファイルが入っているフォルダ
const outputDir = './public/assets'; // 暗号化後のファイルを保存するフォルダ

// 暗号化キー
const key = 'your-secret-key';

// 入力ディレクトリのJSONファイルを処理
fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  files.forEach((file) => {
    const filePath = path.join(inputDir, file);

    // 拡張子が.jsonのファイルのみを処理
    if (path.extname(file) === '.json') {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading file:', file, err);
          return;
        }

        // JSONデータを暗号化
        try {
          const jsonData = JSON.parse(data);
          const encryptedData = encrypt(jsonData, key);

          // 暗号化したデータを同じファイル名でassetsディレクトリに保存
          const outputFilePath = path.join(outputDir, file);
          fs.writeFileSync(outputFilePath, encryptedData);
          console.log(`${file} has been encrypted and saved to ${outputFilePath}`);
        } catch (error) {
          console.error('Error encrypting file:', file, error);
        }
      });
    }
  });
});
