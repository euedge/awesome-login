const path = require('path');

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'awesome-login.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
