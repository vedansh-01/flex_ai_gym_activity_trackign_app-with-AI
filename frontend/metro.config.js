const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add 'csv' to the list of asset extensions so it gets bundled in the APK
config.resolver.assetExts.push('csv');

module.exports = withNativeWind(config, { input: "./global.css" });
