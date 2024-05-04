import verifyLogged from "../../utils/verifyLogged.js";
import verifyAdmin from "../../utils/verifyAdmin.js";

import userSchema from "../../models/User.js";

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

  fastify.get("/user/:id", {
    preHandler: fastify.auth([verifyAdmin]),
    handler: getUser,
  });

  fastify.put("/user/:id", {
    preHandler: fastify.auth([verifyAdmin]),
    handler: updateUser,
  });

  fastify.delete("/user/:id", {
    // schema: userSchema.deleteUser,
    preHandler: fastify.auth([verifyAdmin]),
    handler: deleteUser,
  });
};

export default (fastify, options, done) => {
  loggedRoutes(fastify);

  done();
};
