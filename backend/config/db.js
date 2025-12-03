// backend/configs/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,     // Database name
  process.env.DB_USER,     // Database user
  process.env.DB_PASSWORD, // Database password
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false, // set to true if you want SQL logs
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Clever Cloud may require this
      },
    },
  }
);

export default sequelize;