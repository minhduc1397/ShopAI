const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Backend NestJS nằm chung repo — Metro không được quét/đóng gói thư mục này
    blockList: [/shopai-backend[/\\].*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
