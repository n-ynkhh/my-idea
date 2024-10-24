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
