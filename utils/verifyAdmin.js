import jwt from "jsonwebtoken";
import config from "../config.js";

import User from "../models/User.js";
import { Op } from "sequelize";

const verifyAdmin = (req, res, done) => {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).send("Access Denied");

  jwt.verify(authorization, config.jwt.secret, async (err, decoded) => {
    if (err) {
      done(new Error("Unauthorized"));
    }

    if (!decoded.id || !decoded.username) {
      done(new Error("Unauthorized"));
    }

    const dbUser = await User.findOne({
      where: {
        [Op.and]: [{ id: decoded.id }, { username: decoded.username }],
      },
    });

    if (!dbUser) {
      return done(new Error("Unauthorized"));
    }

    if (dbUser.role !== "admin") {
      return done(new Error("Unauthorized"));
    }

    req.user = decoded;

    // done();
  });
  done();
};

export default verifyAdmin;
