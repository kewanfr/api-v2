import jwt from "jsonwebtoken";
import config from "../config.js";

import User from "../models/User.js";
import { Op } from "sequelize";

const verifyAdmin = (req, res, done) => {
  const { authorization } = req.headers;
  if (!authorization)
    return res.status(401).send({
      error: "Access Denied",
    });

  jwt.verify(authorization, config.jwt.secret, async (err, decoded) => {
    if (err) {
      return res.status(401).send({
        error: "Access Denied",
      });
    }

    if (!decoded || !decoded.id || !decoded.username) {
      // return done(new Error("Unauthorized"));
      return res.status(401).send({
        error: "Access Denied",
      });
    }

    const dbUser = await User.findOne({
      where: {
        [Op.and]: [{ id: decoded.id }, { username: decoded.username }],
      },
    });

    if (!dbUser) {
      // return done(new Error("Unauthorized"));
      return res.status(401).send({
        error: "Access Denied",
      });
    }

    if (dbUser.role !== "admin") {
      // return done(new Error("Unauthorized"));
      return res.status(401).send({
        status: 401,
        error: "Access Denied",
        message: "Not admin",
      });
    }

    req.user = decoded;

    // done();
  });
  done();
};

export default verifyAdmin;
