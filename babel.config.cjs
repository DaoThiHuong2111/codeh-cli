module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '16'
      }
    }],
    '@babel/preset-react',
    '@babel/preset-typescript'
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '^@/(.*)': './src/$1'
        }
      }
    ],
    'add-import-extension'
  ]
};