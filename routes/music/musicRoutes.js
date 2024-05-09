import verifyLogged from "../../utils/verifyLogged.js";
import { MusicFunctions } from "../../utils/music/music.js";
import config from "../../config.js";
import { index } from "../index/indexController.js";
import LyricsFunctions from "../../utils/music/lyrics.js";
import ytdl from "ytdl-core";
import {
  cleanVideoTitle,
  parseStringJSONOrNot,
} from "../../utils/functions.js";
import { fileSystem } from "../../utils/music/fileSystem.js";

const musicController = new MusicFunctions();
const lyricsController = new LyricsFunctions();
const fileSystemController = new fileSystem();

export default (fastify, options, done) => {
  musicController.setSocket(fastify.io);
  console.log("Music routes");
  fastify.io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });

    socket.emit("message", {
      action: "message",
      message: "Hello from server",
    });

    socket.on("message", async (message) => {
      // console.log("Message received: " + message);

      if (!message) {
        return;
      }

      const data = await parseStringJSONOrNot(message);

      if (typeof data !== "object") {
        return;
      }

      if (data.action === "message") {
        socket.emit(
          "message",
          JSON.stringify({
            action: "message",
            message: "hello client",
          })
        );
      } else if (data.action == "queue") {
        const queue = await musicController.getDownloadQueue();

        socket.emit(
          "message",
          JSON.stringify({
            action: "queue",
            queue,
          })
        );
      } else if (data.action == "tracks") {
        const tracks = await musicController.getDownloadedTracks();

        socket.emit(
          "message",
          JSON.stringify({
            action: "tracks",
            tracks,
          })
        );
      }
    });
  });

  fastify.route({
    method: "GET",
    url: "/",
    handler: index,
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
  fastify.get("/music/track/youtube/:youtube_id", {
    handler: async (req, reply) => {
      const { youtube_id } = req.params;

      let response = await musicController.getTrackFromYoutubeId(youtube_id);

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

  fastify.get("/music/queue", {
    handler: async (req, reply) => {
      let response = await musicController.getDownloadQueue();

      reply.code(200).send(response);
    },
  });

  fastify.get("/music/queue/clear", {
    handler: async (req, reply) => {
      let response = await musicController.clearDownloadQueue();

      reply.code(200).send(response);
    },
  });

  fastify.get("/music/queue/all", {
    handler: async (req, reply) => {
      let response = await musicController.getAllQueue();

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

  fastify.get("/music/download/youtube/:youtube_id", {
    preHandler: fastify.auth([verifyLogged]),
    handler: async (req, reply) => {
      let { youtube_id } = req.params;

      let youtube_url = `https://www.youtube.com/watch?v=${youtube_id}`;

      let repYt = await ytdl.getBasicInfo(youtube_url);

      let details = repYt.videoDetails;
      let title = cleanVideoTitle(details.title, details.author.name);
      let track_info = {
        name: title,
        artists: [details.author.name],
        album_name: title,
        release_date: details.uploadDate.split("T")[0],
        cover_url: details.thumbnails[details.thumbnails.length - 1].url,
        track_number: 1,
        youtube_url,
        spotify_id: null,
      };

      let response = await musicController.downloadFromDatas(
        track_info,
        req.user?.id
      );

      if (response == config.QUEUE_STATUS.ALREADY_IN_QUEUE) {
        return reply.code(200).send({
          message: "File already downloaded",
          track: track_info.title,
          spotify_id: track_info.spotify_id || "",
          youtube_id,
        });
      }

      if (response == config.QUEUE_STATUS.PENDING) {
        return reply.code(200).send({
          message: "File added to the queue",
          track: track_info.title,
          spotify_id: track_info.spotify_id || "",
          youtube_id,
        });
      }

      return reply.code(500).send({
        message: "An error occurred",
        track: track_info.title,
        spotify_id: track_info.spotify_id || "",
        youtube_id,
      });

      // return reply.code(200).send(track_info);
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

  fastify.get("/music/lyrics/:query", {
    handler: async (req, reply) => {
      const { query } = req.params;

      let response = await lyricsController.getLyrics(query);

      if (!response) {
        return reply.code(404).send({
          message: "No lyrics found",
        });
      }

      return reply.code(200).send(response);
    },
  });

  fastify.get("/music/mount/local", {
    handler: async (req, reply) => {
      let response = await fileSystemController.verifyLocalMount();

      return reply.code(200).send(response);
    },
  });

  fastify.post("/music/mount/local", {
    handler: async (req, reply) => {
      let response = await fileSystemController.mountLocal();

      return reply.code(200).send(response);
    },
  });

  fastify.delete("/music/mount/local", {
    handler: async (req, reply) => {
      let response = await fileSystemController.unMountLocal();

      return reply.code(200).send(response);
    },
  });

  fastify.get("/music/mount/server", {
    handler: async (req, reply) => {
      let response = await fileSystemController.verifyServerMount();

      return reply.code(200).send(response);
    },
  });

  fastify.post("/music/mount/server", {
    handler: async (req, reply) => {
      let response = await fileSystemController.mountPlexServer();

      return reply.code(200).send(response);
    },
  });

  fastify.delete("/music/mount/server", {
    handler: async (req, reply) => {
      let response = await fileSystemController.unMountPlexServer();

      return reply.code(200).send(response);
    },
  });

  done();
};
