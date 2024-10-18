import { selector, useRecoilValue } from 'recoil';

const yearDataSelector = selector({
  key: 'yearDataSelector',
  get: async ({ get }) => {
    const year = get(selectedYearState); // 選択された年の状態
    const response = await fetch(`/assets/data${year}.json`);
    const data = await response.json();
    return data;
  },
});

const MyComponent = () => {
  const yearData = useRecoilValue(yearDataSelector);

  return (
    <div>
      <h1>Data for Selected Year</h1>
      <pre>{JSON.stringify(yearData, null, 2)}</pre>
    </div>
  );
};





const decrypt = (encryptedData: string, key: string) => {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

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
