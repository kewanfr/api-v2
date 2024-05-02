import verifyLogged from "../../utils/verifyLogged.js";


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
    preHandler: fastify.auth([verifyLogged]),
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
  loggedRoutes(fastify);

  // fastify.register(fastifyAuth).after(() => loggedRoutes(fastify));

  done();
};
