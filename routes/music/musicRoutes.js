import fastify from "fastify";

import verifyLogged from "../../utils/verifyLogged.js";
import verifyAdmin from "../../utils/verifyAdmin.js";
import { MusicFunctions } from "../../utils/music/music.js";
import config from "../../config.js";
import yts from "yt-search";
import { index } from "../index/indexController.js";

const musicController = new MusicFunctions();

const loggedMusicRoutes = (fastify) => {};

const loggedAdminRoutes = (fastify) => {};

export default (fastify, options, done) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: index,
    wsHandler: (socket, req) => {
      fastify.socket = socket;

      musicController.setSocket(fastify.socket);

      console.log("WebSocket Connected");

      socket.once("message", (message) => {
        console.log(message.toString());
        const data = JSON.parse(message.toString());

        if (data.action === "message") {
          musicController.sendSocketMessage({
            action: "message",
            message: "hello client",
          });
        }
      });
    },
  });

  fastify.get("/music/search/:query", {
    handler: async (req, reply) => {
      const { query } = req.params;

      // query params
      let limit = req.query.limit || 20;
      let type = req.query.type || "*";

      let items = await musicController.search(query, type, limit);

      reply.code(200).send(items);
    },
  });

  fastify.get("/music/search/youtube/:query", {
    handler: async (req, reply) => {
      const { query } = req.params;

      // query params
      let limit = req.query.limit || 20;
      let type = req.query.type || "*";

      let items = await musicController.searchYoutube(query);

      console.log("items", items);

      reply.code(200).send(items);
    },
  });

  fastify.get("/music/artist/:artist_id", {
    handler: async (req, reply) => {
      const { artist_id } = req.params;

      let response = await musicController.getArtistTracks(artist_id);

      reply.code(200).send(response);
    },
  });

  fastify.get("/music/track/:track_id", {
    handler: async (req, reply) => {
      const { track_id } = req.params;

      let response = await musicController.getTrack(track_id);

      reply.code(200).send(response);
    },
  });

  fastify.get("/music/tracks", {
    handler: async (req, reply) => {
      let response = await musicController.getDownloadedTracks();

      reply.code(200).send(response);
    },
  });

  fastify.delete("/music/track/:track_id", {
    handler: async (req, reply) => {
      const { track_id } = req.params;

      let response = await musicController.deleteTrack(track_id);

      if (!response.error) {
        return reply.code(200).send(response);
      }

      return reply.code(500).send(response);
    },
  });

  fastify.post("/music/download/data", {
    preHandler: fastify.auth([verifyLogged]),
    handler: async (req, reply) => {
      // track_infos in body
      let track_info = req.body;

      if (!track_info) {
        return reply.code(400).send({
          message: "Invalid request",
        });
      }

      if (
        !track_info.name ||
        !track_info.artists ||
        !track_info.album_name ||
        !track_info.release_date ||
        !track_info.cover_url ||
        !track_info.track_number
      ) {
        return reply.code(400).send({
          message: "Invalid request",
        });
      }

      const track_title = `${track_info.name} - ${track_info.artists.join(
        ", "
      )}`;

      let response = await musicController.downloadFromDatas(
        track_info,
        req.user?.id
      );

      if (response == config.QUEUE_STATUS.ALREADY_IN_QUEUE) {
        return reply.code(200).send({
          message: "File already downloaded",
          track: track_title,
          spotify_id: track_info.spotify_id,
        });
      }

      if (response == config.QUEUE_STATUS.PENDING) {
        return reply.code(200).send({
          message: "File added to the queue",
          track: track_title,
          spotify_id: track_info.spotify_id,
        });
      }

      return reply.code(500).send({
        message: "An error occurred",
        track: track_title,
        spotify_id: track_info.spotify_id,
      });
    },
  });

  fastify.get("/music/download/spotify/:spotify_track_id", {
    preHandler: fastify.auth([verifyLogged]),
    handler: async (req, reply) => {
      const { spotify_track_id } = req.params;

      console.log("spotify_track_id", spotify_track_id);

      let response = await musicController.downloadFromSpotifyId(
        spotify_track_id,
        req.user?.id
      );

      if (response == config.QUEUE_STATUS.ALREADY_IN_QUEUE) {
        return reply.code(200).send({
          message: "File already downloaded",
        });
      }

      if (response == config.QUEUE_STATUS.PENDING) {
        return reply.code(200).send({
          message: "File added to the queue",
        });
      }

      return reply.code(500).send({
        message: "An error occurred",
      });
    },
  });

  fastify.get("/music/download/search/:query", {
    handler: async (req, reply) => {
      const { query } = req.params;
      let items = await musicController.search(query, "track", 1);

      if (!items.tracks || items.tracks.length == 0) {
        return reply.code(404).send({
          message: "No results found",
        });
      }

      const track_info = items.tracks[0];
      const track_title = `${track_info.name} - ${track_info.artists.join(
        ", "
      )}`;
      let response = await musicController.downloadFromDatas(
        track_info,
        req.user?.id
      );

      if (response == config.QUEUE_STATUS.ALREADY_IN_QUEUE) {
        return reply.code(200).send({
          message: "File already downloaded",
          track: track_title,
          spotify_id: track_info.spotify_id,
        });
      }

      if (response == config.QUEUE_STATUS.PENDING) {
        return reply.code(200).send({
          message: "File added to the queue",
          track: track_title,
          spotify_id: track_info.spotify_id,
        });
      }

      return reply.code(500).send({
        message: "An error occurred",
        track: track_title,
        spotify_id: track_info.spotify_id,
      });
    },
  });

  done();
};
