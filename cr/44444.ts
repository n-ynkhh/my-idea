import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.json')) {
            // JSONファイルの場合、ハッシュのみのファイル名にする
            return '[hash].json';
          }
          // それ以外のファイルは通常のファイル名設定
          return 'assets/[name].[hash][ext]';
        },
      },
    },
  },
});
]

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.json')) {
            // JSONファイルの場合、拡張子なしのハッシュ名にする
            return '[hash]';
          }
          // それ以外のファイルは通常のファイル名設定
          return 'assets/[name].[hash][ext]';
        },
      },
    },
  },
});
