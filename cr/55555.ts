import CryptoJS from 'crypto-js';

// 暗号化データの復号化関数
const decrypt = (encryptedData: string, key: string) => {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
};

// データを取得して復号化する関数
const fetchAndDecryptData = async (year: number) => {
  const response = await fetch(`/assets/encrypted_data${year}.json`);
  const encryptedData = await response.text();
  const key = 'your-secret-key';
  
  try {
    const data = decrypt(encryptedData, key);
    return data;
  } catch (error) {
    console.error("Failed to decrypt data", error);
  }
};



const CryptoJS = require("crypto-js");

// 暗号化キー
const secretKey = "my_secret_key";

// JSONデータ（例）
const jsonData = {
  name: "Alice",
  age: 25,
  city: "Tokyo"
};

// JSONデータを文字列化
const jsonString = JSON.stringify(jsonData);

// JSONデータをAES暗号で暗号化
const encryptedData = CryptoJS.AES.encrypt(jsonString, secretKey).toString();

console.log("暗号化されたデータ:", encryptedData);

// 暗号化されたデータを複合化
const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);

// 複合化されたJSONデータ
const decryptedJson = JSON.parse(decryptedData);

console.log("複合化されたデータ:", decryptedJson);
