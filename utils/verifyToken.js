import jwt from "jsonwebtoken";
import config from "../config.js";
import User from "../models/User.js";
import { Op } from "sequelize";

const verifyToken = (token) => {
  if (!token) {
    return null;
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
      if (err) {
        resolve(null);
        // reject(err);
      }

      if (!decoded || !decoded.id || !decoded.username) {
        resolve(null);
        // reject(new Error("Unauthorized"));
      }

      const dbUser = await User.findOne({
        where: {
          [Op.and]: [{ id: decoded.id }, { username: decoded.username }],
        },
      });

      if (!dbUser) {
        resolve(null);
        // reject(new Error("Unauthorized"));
      }

      resolve(decoded);
    });
  });
};

export default verifyToken;
