import fastify from "fastify";
import {
  authLoginHandler,
  authRegisterHandler,
  getUserHandler,
} from "./authController.js";

import fastifyAuth from "@fastify/auth";
import verifyToken from "../../utils/verifyToken.js";

const loggedAuthRoutes = (fastify) => {
  fastify.get("/auth/me", {
    preHandler: fastify.auth([verifyToken]),
    handler: getUserHandler,
  });
};

export default (fastify, options, done) => {
  fastify.post("/auth/register", {
    handler: authRegisterHandler,
  });

  fastify.post("/auth/login", {
    handler: authLoginHandler,
  });

  fastify.register(fastifyAuth).after(() => loggedAuthRoutes(fastify));

  done();
};
