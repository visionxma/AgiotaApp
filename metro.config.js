const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona suporte para React Native Firebase
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Configurações específicas para Firebase
config.resolver.assetExts.push('plist');

module.exports = config;