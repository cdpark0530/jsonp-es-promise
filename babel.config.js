module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        shippedProposals: true,
        useBuiltIns: 'usage',
        modules: false,
      },
    ],
    ['@babel/preset-typescript'],
  ],
  plugins: ['@babel/plugin-syntax-dynamic-import'],
};
