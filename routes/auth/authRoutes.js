import fastify from "fastify";
import {
  authLoginHandler,
  authRegisterHandler,
  getUserHandler,
} from "./authController.js";

import verifyLogged from "../../utils/verifyLogged.js";


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


  loggedAuthRoutes(fastify);

  // fastify.register(fastifyAuth).after(() => loggedAuthRoutes(fastify));

  done();
};
