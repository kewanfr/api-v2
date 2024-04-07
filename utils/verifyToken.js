import jwt from "jsonwebtoken";
import config from "../config.js";

const verifyToken = (req, res, done) => {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).send("Access Denied");

  jwt.verify(authorization, config.jwt.secret, (err, decoded) => {
    if (err) {
      done(new Error("Unauthorized"));
    }

    req.user = decoded;
    done();
  });

  done();
};

export default verifyToken;
