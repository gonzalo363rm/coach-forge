const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reducir workers para usar menos memoria
config.maxWorkers = 2;

module.exports = config;
