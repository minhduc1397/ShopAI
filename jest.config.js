module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Backend có bộ test riêng (cd shopai-backend && npm test); e2e Maestro chạy trên máy ảo
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/shopai-backend/', '<rootDir>/.maestro/'],
  modulePathIgnorePatterns: ['<rootDir>/shopai-backend/'],
  // Các thư viện phát hành dạng ESM cần Babel biên dịch lại cho Jest
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-navigation|@tanstack|zustand|expo(-.*)?|@shopify)/)',
  ],
};
