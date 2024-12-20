import { atom } from 'recoil';

export const selectedYearAtom = atom<string>({
  key: 'selectedYearAtom',
  default: '2023', // 初期値として2023年度を設定
});


import { selector } from 'recoil';
import { selectedYearAtom } from './atoms';

export const companyDataSelector = selector({
  key: 'companyDataSelector',
  get: async ({ get }) => {
    const selectedYear = get(selectedYearAtom);
    const response = await fetch(`/path/to/data/${selectedYear}_data.json`);
    const data = await response.json();
    return data;
  },
});


import { atom } from 'recoil';

export const userSelectAtom = atom({
  key: 'userSelectAtom',
  default: {
    filterCondition: 'all', // 例: "all"、"selected"などのフィルタ条件
    selectedIds: [] // 例: 選択されたデータのID
  },
});


import { selector } from 'recoil';
import { companyDataSelector, userSelectAtom } from './selectors';

export const dispDataSelector = selector({
  key: 'dispDataSelector',
  get: ({ get }) => {
    const companyData = get(companyDataSelector);
    const userSelect = get(userSelectAtom);

    // フィルタ条件に応じてデータを変換する例
    if (userSelect.filterCondition === 'selected') {
      return companyData.filter(item => userSelect.selectedIds.includes(item.id));
    }
    
    // デフォルトでは全データを返す
    return companyData;
  },
});


import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { dispDataSelector } from './selectors';

const MyComponent = ({ filterValue }) => {
  const [dispData, setDispData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // ここでRecoilの値を非同期で取得
      const data = useRecoilValue(dispDataSelector(filterValue));
      setDispData(data);
    };

    loadData(); // useEffect内で非同期処理を実行
  }, [filterValue]); // filterValueが変わるたびに再実行

  return (
    <div>
      {dispData ? (
        <ul>
          {dispData.map((item, index) => (
            <li key={index}>{item.name}</li>
          ))}
        </ul>
      ) : (
        <p>データを読み込み中...</p>
      )}
    </div>
  );
};

export default MyComponent;

