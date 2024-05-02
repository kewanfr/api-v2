import { index, infos } from "./indexController.js";

export default (fastify, options, done) => {
  fastify.get("/infos", infos);

  done();
};
