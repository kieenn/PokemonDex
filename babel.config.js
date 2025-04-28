// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        'expo-router/babel',
        // Other plugins can be here...
        'react-native-reanimated/plugin', // MUST BE LAST
      ],
    };
  };
  