import db from "./db.js";
import bcrypt from "bcryptjs";

// Find a user by username
export async function findUser(username) {
  return db("users").where({ username }).first();
}

// Check if username and password are correct
export async function checkCredentials(username, password) {
  const user = await findUser(username);
  if (!user) return false;

  const isValid = await bcrypt.compare(password, user.password_hash);
  return isValid ? user : false;
}
