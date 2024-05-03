import LyricsFunctions from "../../utils/music/lyrics.js";
import LyricsGeniusFunctions from "../../utils/music/lyricsGenius.js";
import plexFunctions from "../../utils/music/plex.js";

const plexController = new plexFunctions();

export default (fastify, options, done) => {
  fastify.get("/plex/playing/lyrics", {
    handler: async (req, reply) => {
      let lyrics = await plexController.getActualPlayingLyrics();

      reply.code(200).send(lyrics);
    },
  });

  fastify.get("/plex/playing", {
    handler: async (req, reply) => {
      let playing = await plexController.getActualPlaying();

      const lyrics = new LyricsFunctions();
      reply
        .code(200)
        .send(await lyrics.getLyrics(playing.title + " - " + playing.artist));
    },
  });

  fastify.get("/plex/playing/metadata", {
    handler: async (req, reply) => {
      let metadata = await plexController.getActualPlayingMetadata();

      reply.code(200).send(metadata);
    },
  });

  fastify.get("/plex/scan", {
    handler: async (req, reply) => {
      let scan = await plexController.scanMusicLibrary();

      reply.code(200).send(scan);
    },
  });

  done();
};
