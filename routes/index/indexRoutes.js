import { index } from "./indexController.js";

export default (fastify, options, done) => {
  fastify.all('/', index);

  done();
} 