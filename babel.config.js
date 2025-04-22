module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      // You might add other plugins here later if needed, e.g., for reanimated or decorators
      // plugins: ['react-native-reanimated/plugin'], // Example: If using Reanimated v2+
    };
  };