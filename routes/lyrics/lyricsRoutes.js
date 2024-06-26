import verifyLogged from "../../utils/verifyLogged.js";
import config from "../../config.js";
import LyricsFunctions from "../../utils/music/lyrics.js";
import ytdl from "ytdl-core";
import LyricsDatabase from "../../utils/music/lyricsDb.js";

const lyricsController = new LyricsFunctions();
const lyricsDB = new LyricsDatabase();

export default (fastify, options, done) => {
  console.log("Music routes");

  fastify.get("/lyrics", {
    preHandler: verifyLogged,
    handler: async (req, reply) => {
      let items = await lyricsDB.getAllLyrics();

      reply.code(200).send(items);
    },
  });

  fastify.get("/lyrics/autocomplete/:query", {
    handler: async (req, reply) => {
      const { query } = req.params;

      let items = await lyricsDB.search(query);

      reply.code(200).send(items);
    },
  });

  fastify.get("/lyrics/search/:query", {
    handler: async (req, reply) => {
      const { query } = req.params;

      let items = await lyricsDB.search(query);

      reply.code(200).send(items);
    },
  });

  fastify.get("/lyrics/find/:query", {
    handler: async (req, reply) => {
      const { query } = req.params;

      let results = await lyricsDB.search(query);

      if (results.length === 0) {
        const lyrics = await lyricsController.getLyricsAndDB(query);

        return reply.code(200).send(lyrics);
      }

      const item = results[0];
      let lyrics = await lyricsDB.getLyrics(item.id);

      return reply.code(200).send(lyrics);

      // if (results.length === 0) {
      // const path = path.join(config.music.paths.final, query);
      // let geniusLyrics = await lyricsController.lyricsGenius.getLyrics(query);
      // if (geniusLyrics !== "No lyrics found.") {
      //   return geniusLyrics;
      // }
      //   return "No lyrics found.";
      // }

      // reply.code(200).send(items);
    },
  });

  fastify.get("/lyrics/get/:id", {
    handler: async (req, reply) => {
      const { id } = req.params;

      let items = await lyricsDB.getLyrics(parseInt(id));

      reply.code(200).send(items);
    },
  });

  done();
};
