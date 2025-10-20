/**
 * Generates a 6-char uppercase alphanumeric code (0-9, A-Z).
 */
function genTicketVersion() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

module.exports = { genTicketVersion };
