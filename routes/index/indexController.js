
import packagejson from "../../package.json" assert { type: "json" };

import os from "os";
import isAdmin from "../../utils/isAdmin.js";

export const index = async (req, reply) => {
  return { message: "Hello World" };
};

export const infos = async (req, reply) => {
  if ((await isAdmin(req)) == true) {
    return {
      message: "Infos",
      version: packagejson.version,
      fastifyVersion: packagejson.dependencies.fastify,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpus: os.cpus(),
      networkInterfaces: os.networkInterfaces(),
      userInfo: os.userInfo(),
    };
  } else {
    reply.code(401);

    reply.send({
      statusCode: 401,
      message: "You are not an admin",
      version: packagejson.version,
      platform: process.platform,
      nodeVersion: process.version,
    });
  }
};