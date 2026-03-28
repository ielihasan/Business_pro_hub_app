const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

// Packages to force to their CJS build on web (ESM builds use import.meta which breaks web)
const WEB_CJS_OVERRIDES = {
  'zustand': path.resolve(__dirname, 'node_modules/zustand/index.js'),
  'zustand/react': path.resolve(__dirname, 'node_modules/zustand/react.js'),
  'zustand/vanilla': path.resolve(__dirname, 'node_modules/zustand/vanilla.js'),
  'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
  'zustand/traditional': path.resolve(__dirname, 'node_modules/zustand/traditional.js'),
  'zustand/shallow': path.resolve(__dirname, 'node_modules/zustand/shallow.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return { type: 'sourceFile', filePath: require.resolve('./lib/web-stubs/maps.js') };
  }
  if (platform === 'web' && moduleName === '@pkgr/core') {
    return { type: 'sourceFile', filePath: require.resolve('./lib/web-stubs/pkgr-core.js') };
  }
  if (platform === 'web' && WEB_CJS_OVERRIDES[moduleName]) {
    return { type: 'sourceFile', filePath: WEB_CJS_OVERRIDES[moduleName] };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
