import verifyToken from "../../utils/verifyToken.js";
import verifyAdmin from "../../utils/verifyAdmin.js";

import fastifyAuth from "@fastify/auth";
import {
  deleteUser,
  getAllUsersHandler,
  getUser,
  getUserHandler,
  updateUser,
} from "./usersController.js";

const loggedRoutes = (fastify) => {
  fastify.get("/users/me", {
    preHandler: fastify.auth([verifyToken]),
    handler: getUserHandler,
  });

  fastify.get("/users", {
    preHandler: fastify.auth([verifyAdmin]),
    handler: getAllUsersHandler,
  });

  fastify.get("/users/:id", {
    preHandler: fastify.auth([verifyAdmin]),
    handler: getUser,
  });

  fastify.put("/users/:id", {
    preHandler: fastify.auth([verifyAdmin]),
    handler: updateUser,
  });

  fastify.delete("/users/:id", {
    preHandler: fastify.auth([verifyAdmin]),
    handler: deleteUser,
  });
};

export default (fastify, options, done) => {
  fastify.register(fastifyAuth).after(() => loggedRoutes(fastify));

  done();
};
