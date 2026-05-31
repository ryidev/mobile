module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4: use jsxImportSource
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Path aliases — matches tsconfig.json paths
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
        },
      ],
      // Required for React Native Reanimated (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};
