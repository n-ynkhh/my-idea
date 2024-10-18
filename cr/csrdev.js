const crypto = require('crypto');
const fs = require('fs');

const encrypt = (data, key) => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// JSONデータを暗号化
const jsonData = { /* JSONデータ */ };
const key = 'your-secret-key';
const encryptedData = encrypt(jsonData, key);

// ファイルに保存
fs.writeFileSync('encrypted_data.json', encryptedData);
