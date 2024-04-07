import jwt from "jsonwebtoken";
import config from "../config.js";

const signToken = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      jwt.sign(
        data,
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn },
        (err, token) => {
          if (err) {
            // throw and reject error
            console.error(err);
            reject(err);
            throw err;
          }

          resolve(token);
        }
      );

      await resolve;
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
};

export default signToken;
