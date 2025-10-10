import bcrypt from "bcryptjs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Delete existing entries
  await knex("users").del();

  // Insert test users
  const passwordHash = await bcrypt.hash("password123", 10);

  await knex("users").insert([
    { username: "matin", password_hash: passwordHash },
    { username: "testuser", password_hash: passwordHash }
  ]);
}
