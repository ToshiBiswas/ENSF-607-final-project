// src/server.js
// Small wrapper so Docker or `node src/server.js` works.
// It imports the documented Express app from ./app.js and starts listening.
const app = require('./app');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
