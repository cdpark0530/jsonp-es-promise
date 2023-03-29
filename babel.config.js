module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
        targets: {
          browsers: ['>2%', 'not ie 11', 'not op_mini all'],
        },
      },
    ],
    ['@babel/preset-typescript'],
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: 3,
      },
    ],
  ],
};
