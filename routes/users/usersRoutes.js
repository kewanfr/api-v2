import verifyToken from "../../utils/verifyToken.js";
import verifyAdmin from "../../utils/verifyAdmin.js";

import fastifyAuth from "@fastify/auth";

const loggedRoutes = (fastify) => {
  fastify.get("/me", {
    preHandler: fastify.auth([verifyAdmin]),
    handler: (req, reply) => {
      return req.user;
    },
  });
};

export default (fastify, options, done) => {
  fastify.register(fastifyAuth).after(() => loggedRoutes(fastify));

  done();
};
