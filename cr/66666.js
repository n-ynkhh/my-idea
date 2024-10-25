const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

// 暗号化キー
const secretKey = "my_secret_key";

// test.jsonファイルのパス
const filePath = path.join(__dirname, 'data', 'test.json');

// JSONファイルを読み込む
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('ファイルの読み込みに失敗しました:', err);
    return;
  }

  // 読み込んだJSONデータをパース
  const jsonData = JSON.parse(data);
  
  // JSONデータを文字列化
  const jsonString = JSON.stringify(jsonData);

  // JSONデータをAES暗号で暗号化
  const encryptedData = CryptoJS.AES.encrypt(jsonString, secretKey).toString();
  console.log('暗号化されたデータ:', encryptedData);

  // 暗号化されたデータを複合化
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
  
  // 複合化されたJSONデータ
  const decryptedJson = JSON.parse(decryptedData);
  console.log('複合化されたデータ:', decryptedJson);
});
