import { atom } from 'recoil';

// 年度用のatom
export const selectedYearState = atom<string>({
  key: 'selectedYearState',
  default: '2023', // 初期値は2023
});

// 会社データ用のatom
export const companyDataState = atom<any[]>({
  key: 'companyDataState',
  default: [], // 初期値は空の配列
});



import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { companyDataState, selectedYearState } from './atoms';

const fetchCompanyData = async (year: string) => {
  const response = await fetch(`/path/to/data/${year}_data.json`);
  const data = await response.json();
  return data;
};

const CompanyDataComponent = () => {
  const [companyData, setCompanyData] = useRecoilState(companyDataState);
  const selectedYear = useRecoilValue(selectedYearState);

  // ページ初期表示時にcompanyDataが空の場合のみfetchを実行
  useEffect(() => {
    const initializeData = async () => {
      if (companyData.length === 0) {
        try {
          const data = await fetchCompanyData(selectedYear); // selectedYearに基づいてfetch
          setCompanyData(data); // データをatomにセット
        } catch (error) {
          console.error('Failed to fetch company data', error);
        }
      }
    };

    initializeData();
  }, [companyData, selectedYear, setCompanyData]);

  // 年度変更時の処理（任意で実装可能）
  const handleYearChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = event.target.value;
    const data = await fetchCompanyData(newYear);
    setCompanyData(data); // 年度が変更された場合は即座にデータを更新
  };

  return (
    <div>
      {/* 年度選択 */}
      <select onChange={handleYearChange} value={selectedYear}>
        <option value="2022">2022</option>
        <option value="2023">2023</option>
        <option value="2024">2024</option>
      </select>

      {/* 会社データの表示 */}
      <div>
        {companyData.length > 0 ? (
          <ul>
            {companyData.map((item, index) => (
              <li key={index}>{item.name}</li> // 表示内容に応じて調整
            ))}
          </ul>
        ) : (
          <p>データがありません</p>
        )}
      </div>
    </div>
  );
};

export default CompanyDataComponent;
