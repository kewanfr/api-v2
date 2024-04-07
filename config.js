// dotenv
import dotenv from "dotenv";
dotenv.config();

export default {
  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  server: {
    port: process.env.PORT,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: 3 * 86400, // 3 days
  },
};
