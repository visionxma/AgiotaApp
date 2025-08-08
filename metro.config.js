const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona suporte para React Native Firebase
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;