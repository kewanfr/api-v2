import jwt from "jsonwebtoken";
import config from "../config.js";

import User from "../models/User.js";
import { Op } from "sequelize";

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} done
 * @returns true if the user is an admin, false otherwise, even if not connected
 */
const isAdmin = (req) => {
  return new Promise((resolve, reject) => {
    const { authorization } = req.headers;
    if (!authorization) return resolve(false);

    jwt.verify(authorization, config.jwt.secret, async (err, decoded) => {
      if (err) {
        return resolve(false);
      }

      if (!decoded.id || !decoded.username) {
        return resolve(false);
      }

      const dbUser = await User.findOne({
        where: {
          [Op.and]: [{ id: decoded.id }, { username: decoded.username }],
        },
      });

      if (!dbUser) {
        return resolve(false);
      }

      if (dbUser.role !== "admin") {
        return resolve(false);
      }

      req.user = decoded;

      return resolve(true);
    });
  });
};

export default isAdmin;
