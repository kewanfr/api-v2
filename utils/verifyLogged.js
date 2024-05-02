import jwt from "jsonwebtoken";
import config from "../config.js";
import User from "../models/User.js";
import { Op } from "sequelize";

const verifyLogged = (req, res, done) => {
  const { authorization } = req.headers;
  if (!authorization)
    return res.status(401).send({
      error: "Access Denied",
    });

  jwt.verify(authorization, config.jwt.secret, async (err, decoded) => {
    if (err) {
      return res.status(401).send({
        error: "Unauthorized",
      });
    }

    if (!decoded || !decoded.id || !decoded.username) {
      return res.status(401).send({
        error: "Unauthorized",
      });
      // return done(new Error("Unauthorized"));
    }

    console.log("decoded", decoded);

    const dbUser = await User.findOne({
      where: {
        [Op.and]: [{ id: decoded.id }, { username: decoded.username }],
      },
    });

    if (!dbUser) {
      return res.status(401).send({
        error: "Unauthorized",
      });
      // return done(new Error("Unauthorized"));
    }

    req.user = decoded;
    console.log("req.user", req.user);
    done();
  });

};

export default verifyLogged;
