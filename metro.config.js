const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Backend NestJS nằm chung repo + báo cáo coverage của Jest — Metro không quét/đóng gói
    blockList: [/shopai-backend[/\\].*/, /[/\\]coverage[/\\].*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
