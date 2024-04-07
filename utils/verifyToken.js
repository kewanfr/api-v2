import jwt from "jsonwebtoken";
import config from "../config.js";

const verifyToken = (req, res, done) => {
  const { authorization } = req.headers;
  console.log(req.headers);
  console.log(authorization);
  if (!authorization) return res.status(401).send("Access Denied");

  jwt.verify(authorization, config.jwt.secret, (err, decoded) => {
    console.log(decoded);
    console.log(err);
    if (err) {
      done(new Error("Unauthorized"));
    }

    req.user = decoded;
  });

  done();
};

export default verifyToken;
