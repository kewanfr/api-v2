import fastify from "fastify";
import {
  authLoginHandler,
  authRegisterHandler,
  getUserHandler,
} from "./authController.js";

import verifyLogged from "../../utils/verifyLogged.js";
import verifyToken from "../../utils/verifyToken.js";

const loggedAuthRoutes = (fastify) => {
  fastify.get("/auth/me", {
    preHandler: fastify.auth([verifyLogged]),
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

  fastify.get("/auth/verifyToken", {
    handler: async (req, reply) => {
      const token = req.headers.Authorization || req.headers.authorization;

      if (!token) {
        return reply.code(400).send({ message: "Missing token" });
      }

      const data = await verifyToken(token);

      if (!data) {
        return reply.code(401).send({ message: "Invalid token" });
      }

      return reply.send(data);
    },
  });

  loggedAuthRoutes(fastify);

  // fastify.register(fastifyAuth).after(() => loggedAuthRoutes(fastify));

  done();
};
