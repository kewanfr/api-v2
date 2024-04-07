import { authLoginHandler, authRegisterHandler } from "./authController.js";

export default (fastify, options, done) => {
  fastify.post("/auth/register", {
    handler: authRegisterHandler,
  });

  fastify.post("/auth/login", {
    handler: authLoginHandler,
  });

  done();
};
