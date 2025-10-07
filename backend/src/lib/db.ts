import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const {
  DB_DIALECT = "mysql",
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_NAME = "nicetrips",
  DB_USER = "nicetrips",
  DB_PASS = "secret",
  DB_LOGGING = "false",
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: DB_DIALECT as Dialect,
  logging: DB_LOGGING === "true" ? console.log : false,
});

export async function assertDB() {
  try {
    await sequelize.authenticate();
    console.log("[DB] Connected");
  } catch (error) {
    console.error("[DB] Connection failed", error);
    throw error;
  }
}

export default sequelize;
