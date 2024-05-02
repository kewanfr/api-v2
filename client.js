import { EventEmitter } from "node:events";
import fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";

import path from "path";
import fs from "fs";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import sequelize from "./models/database.js";
import { getDirectories, getFiles } from "./utils/functions.js";
import config from "./config.js";

const ROUTES_DIR = path.join(__dirname, "routes");
const MODELS_DIR = path.join(__dirname, "models");

class MyClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.app = fastify({
      // logger: true
    });

    this.init(options);
  }

  async init(options) {
    await this.app.register(fastifyStatic, {
      root: path.join(__dirname, "public"),
      prefix: "/",
    });

    await this.app.register(cors, {
      origin: "*",
    });

    // log all requests
    this.app.addHook("onRequest", (request, reply, done) => {
      console.log(
        `[${request.method}] ${request.url} ${request.ip} ${request.body}`
      );
      done();
    });

    this.app.addHook("onError", (request, reply, error, done) => {
      console.error(error);
      done();
    });

    this.sequelize = sequelize;

    this.options = {
      port: config.server.port,
      host: "0.0.0.0",
      ...options,
    };

    this.directories = [];

    await this.connectDatabase();
    await this.start();
  }

  async start() {
    await this.loadRoutes();

    return new Promise((resolve, reject) => {
      this.app.listen(this.options, async (err, address) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log(
            `Server listening on http://${config.server.host}:${config.server.port}`
          );
          await this.app.ready();
          resolve(address);
        }
      });
    });
  }

  async stop() {
    return new Promise((resolve, reject) => {
      this.app.close((err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log("Server stopped");
          resolve();
        }
      });
    });
  }

  async loadModels() {
    const files = await getFiles(MODELS_DIR);

    // seulement si ça commence par une majuscule
    const models = files
      .filter((dir) => /^[A-Z]/.test(dir))
      .map((fileName) => {
        console.log(`Loading model ${fileName}`);
        return import(`./models/${fileName}`);
      });

    return Promise.all(models);
  }

  async connectDatabase() {
    try {
      await this.loadModels();
      await this.sequelize.sync(); // Crée la base de données si elle n'existe pas
      console.log("Database connected and synchronized.");

      return this.sequelize;
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  async loadRoutes() {
    return new Promise(async (resolve, reject) => {
      const directories = await getDirectories(ROUTES_DIR);
      this.directories = directories;
      await this.app.register(fastifyAuth).after(async () => {
        for (const dir of directories) {
          if (!fs.existsSync(path.join(ROUTES_DIR, dir, `${dir}Routes.js`))) {
            console.log(`No route file found for ${dir}`);
            continue;
          }
          const route = await import(`./routes/${dir}/${dir}Routes.js`);

          console.log(`Registering route ${dir}`);

          this.app.register(route.default);
        }
      });

      resolve();
    });
  }
}

export default MyClient;
