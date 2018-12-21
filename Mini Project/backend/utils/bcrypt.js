const bcrypt = require('bcrypt');

async function hashPassword(plaintextPassword) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plaintextPassword, salt);
  return hash;
}

async function comparePassword(plaintextPassword, hash) {
  const match = await bcrypt.compare(plaintextPassword, hash);
  return match;
}

module.exports = {
  hashPassword,
  comparePassword
};
