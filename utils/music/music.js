import SpotifyGet from "spotify-get";
import config from "../../config.js";

import Download_Queue from "../../models/Download_Queue.js";
import Track from "../../models/Track.js";

import fs from "fs";
import {
  cleanEmptyDirs,
  cleanVideoTitle,
  ensureDir,
  parseAlbumResult,
  parseArtistResult,
  parseTrackResult,
  youtubeUrlToYoutubeId,
} from "../functions.js";
import { Spotify } from "spotifydl-core";
import { Op } from "sequelize";
import path from "path";

import * as YTMusic from "node-youtube-music";
import LyricsFunctions from "./lyrics.js";
import ytdl from "ytdl-core";

export class MusicFunctions {
  constructor() {
    this.spotifyClient = new SpotifyGet({
      consumer: {
        key: config.music.spotify_client_id,
        secret: config.music.spotify_client_secret,
      },
    });

    this.spotifyDownloader = new Spotify(
      {
        clientId: config.music.spotify_client_id,
        clientSecret: config.music.spotify_client_secret,
      },
      config.music.youtube_cookie
    );

    this.TEMP_SONGS_PATH = config.music.paths.temp_songs;
    this.TEMP_COVERS_PATH = config.music.paths.temp_covers;
    this.FINAL_PATH = config.music.paths.final;

    if (!fs.existsSync(this.TEMP_SONGS_PATH)) {
      fs.mkdirSync(this.TEMP_SONGS_PATH, { recursive: true });
    }

    if (!fs.existsSync(this.TEMP_COVERS_PATH)) {
      fs.mkdirSync(this.TEMP_COVERS_PATH, { recursive: true });
    }

    if (!fs.existsSync(this.FINAL_PATH)) {
      fs.mkdirSync(this.FINAL_PATH, { recursive: true });
    }

    this.IS_QUEUE_DOWNLOADING = false;

    this.downloadQueue();

    this.socket = null;

    this.lyrics = new LyricsFunctions();
  }

  setSocket(socket) {
    this.socket = socket;
  }

  getSocket() {
    return this.socket;
  }

  sendSocketMessage(data) {
    if (this.socket) {
      this.socket.sockets.emit("message", JSON.stringify(data));
    }
  }

  async search(query, type = "track", limit = 20) {
    type = type.replace(/ /g, "");
    // Search for a song on Spotify and return clean results
    if (type == "*") {
      type = "artist,album,track";
    }

    const searchDatas = await this.spotifyClient.search({
      q: `${query}`,
      type: type,
      limit: limit,
    });

    const results = {};

    if (searchDatas.tracks?.items) {
      results.tracks = await Promise.all(
        searchDatas.tracks.items.map(async (item) => {
          return await parseTrackResult(item, { searchYoutube: false });
        })
      );
    }

    if (searchDatas.albums?.items) {
      results.albums = await Promise.all(
        searchDatas.albums.items.map((item) => parseAlbumResult(item))
      );
    }

    if (searchDatas.artists?.items) {
      results.artists = await Promise.all(
        searchDatas.artists.items.map((item) => parseArtistResult(item))
      );
    }

    return results;
  }

  async searchYoutube(query) {
    const musics = await YTMusic.searchMusics(query);

    const results = {
      tracks: [],
      albums: [],
      artists: [],
    };

    results.tracks = musics.map((item) => {
      return {
        name: item.title,
        artist: item.artists[0]?.name,
        artists: item.artists?.map((artist) => artist.name),
        album_name: cleanName(item.album),
        youtube_id: item.youtubeId,
        cover_url: item.thumbnailUrl?.split("=")[0] ?? item.thumbnailUrl,
        duration_ms: item.duration.totalSeconds * 1000,
      };
    });

    return results;
  }

  async getArtistTracks(artist_id) {
    const token = await this.spotifyClient.getToken();
    const API_URL = `https://api.spotify.com/v1/artists/${artist_id}/top-tracks?market=FR`;

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    return await Promise.all(
      data.tracks.map(async (item) => {
        return await parseTrackResult(item, { searchYoutube: false });
      })
    );
  }

  async getTrack(track_id) {
    const track_data = await this.spotifyDownloader.getTrack(track_id);
    return track_data;
  }

  async deleteTrack(track_id) {
    const track = await Track.findOne({
      where: {
        [Op.or]: [
          { spotify_id: track_id },
          {
            youtube_id: track_id,
          },
        ],
      },
    });

    if (!track) {
      return {
        error: true,
        message: "Track not found",
      };
    }

    const track_data = track.dataValues;

    const track_path = path.join(
      this.FINAL_PATH,
      track_data.artists.split(", ")[0],
      track_data.album_name,
      `${track_data.name} - ${track_data.artists}.mp3`
    );
    try {
      if (fs.existsSync(track_path)) await fs.unlinkSync(track_path);

      if (fs.existsSync(track_path.replace(".mp3", ".txt")))
        await fs.unlinkSync(track_path.replace(".mp3", ".txt"));

      await cleanEmptyDirs(this.FINAL_PATH);

      await Track.destroy({
        where: {
          id: track_data.id,
        },
      });

      await Download_Queue.destroy({
        where: {
          id: track_data.id,
        },
      });

      this.sendSocketMessage({
        action: "song_deleted",
        song: track_data,
      });

      return {
        error: false,
        message: "Track deleted",
      };
    } catch (error) {
      console.error("Error while deleting track", error);
      return {
        error: true,
        message: "An error occurred",
      };
    }
  }

  async clearFinishedQueue() {
    await Download_Queue.destroy({
      where: {
        status: config.QUEUE_STATUS.FINISHED,
      },
    });

    this.sendSocketMessage({
      action: "queue_cleared",
      queue: await this.getDownloadQueue(),
    });

    return {
      error: false,
      message: "Queue cleared",
    };
  }

  async getAllQueue() {
    const results = await Download_Queue.findAll();

    return results.map((item) => item.dataValues);
  }

  async getDownloadQueue() {
    const results = await Download_Queue.findAll({
      where: {
        status: config.QUEUE_STATUS.PENDING,
      },
    });

    
    const queue = results.map((item) => item.dataValues);
    console.log("Queue", queue);
    // this.sendSocketMessage({
    //   action: "queue",
    //   queue: queue,
    // });

    return queue;
  }

  async getDownloadedTracks() {
    const results = await Track.findAll();

    return results.map((item) => {
      // delete item.dataValues.id;
      delete item.dataValues.release_date;
      delete item.dataValues.createdAt;
      delete item.dataValues.updatedAt;
      delete item.dataValues.status;
      delete item.dataValues.track_number;
      delete item.dataValues.path;
      delete item.dataValues.user_id;

      return item.dataValues;
    });
  }

  async searchQueueByName(name) {
    const results = await Download_Queue.findOne({
      where: {
        name: {
          [Op.like]: "%" + name + "%",
        },
      },
    });

    return results.dataValues;
  }

  async searchQueueById(id) {
    const results = await Download_Queue.findOne({
      where: {
        id: id,
      },
    });

    return results.dataValues;
  }

  async searchQueueBySpotifyId(spotify_id) {
    const results = await Download_Queue.findOne({
      where: {
        spotify_id: spotify_id,
      },
    });

    return results.dataValues;
  }

  async searchQueueByYoutubeId(youtube_id) {
    const results = await Download_Queue.findOne({
      where: {
        youtube_id: youtube_id,
      },
    });

    return results.dataValues;
  }

  async addSongToQueue(track_data, user_id = null) {
    track_data.artists = track_data.artists.join(", ");

    let track_id;
    if (track_data.spotify_id !== null) {
      track_id = track_data.spotify_id;
    } else if (track_data.youtube_id !== null) {
      track_id = track_data.youtube_id;
    }

    const search_track_queue = await Download_Queue.findOne({
      where: {
        [Op.or]: [
          { spotify_id: track_id },
          {
            youtube_id: track_id,
          },
        ],
      },
    });

    const search_track = await Track.findOne({
      where: {
        [Op.or]: [
          { spotify_id: track_id },
          {
            youtube_id: track_id,
          },
        ],
      },
    });

    if (search_track || search_track_queue) {
      console.log(
        `Track ${track_data.name} - ${track_data.artists} already in queue`
      );
      return config.QUEUE_STATUS.ALREADY_IN_QUEUE;
    }

    track_data.user_id = user_id;
    await Download_Queue.create(track_data);

    console.log(
      `Track ${track_data.name} - ${track_data.artists} added to queue`
    );

    this.sendSocketMessage({
      action: "song_added_to_queue",
      song: track_data,
      queue: await this.getDownloadQueue(),
    });

    this.downloadQueue();
    return config.QUEUE_STATUS.PENDING;
  }

  async moveSongToFinalPath(file_name, track_data) {
    const folder_name = path.join(
      track_data.artists[0],
      track_data.album_name
    );

    const final_path = path.join(this.FINAL_PATH, folder_name, file_name);
    const temp_path = path.join(this.TEMP_SONGS_PATH, file_name);

    await ensureDir(path.join(this.FINAL_PATH, folder_name));

    if (!fs.existsSync(temp_path)) {
      console.error(`File ${file_name} not found in temp path`);

      this.sendSocketMessage({
        action: "song_error",
        song: track_data,
        queue: await this.getDownloadQueue(),
      });

      return false;
    }

    this.sendSocketMessage({
      action: "song_downloaded",
      song: track_data,
      queue: await this.getDownloadQueue(),
    });

    // await fs.renameSync(temp_path, final_path);
    await fs.copyFileSync(temp_path, final_path);
    await fs.unlinkSync(temp_path);

    if (fs.existsSync(temp_path.replace(".mp3", ".txt"))) {
      // await fs.renameSync(
      //   temp_path.replace(".mp3", ".txt"),
      //   final_path.replace(".mp3", ".txt")
      // );
      await fs.copyFileSync(
        temp_path.replace(".mp3", ".txt"),
        final_path.replace(".mp3", ".txt")
      );
      await fs.unlinkSync(temp_path.replace(".mp3", ".txt"));
    }

    return true;
  }

  async downloadQueue() {
    if (this.IS_QUEUE_DOWNLOADING) return;

    const download_queue = await this.getDownloadQueue();

    if (download_queue.length === 0) {
      console.log("Queue is empty");
      return;
    }

    this.IS_QUEUE_DOWNLOADING = true;

    const track_info = download_queue[0];

    await Download_Queue.update(
      { status: config.QUEUE_STATUS.DOWNLOADING },
      {
        where: {
          id: track_info.id,
        },
      }
    );

    this.sendSocketMessage({
      action: "song_downloading",
      song: track_info,
      queue: await this.getDownloadQueue(),
    });

    console.log(`Downloading ${track_info.name} - ${track_info.artists}`);

    const fileName = `${track_info.name} - ${track_info.artists}.mp3`;

    const tempFilePath = await path.join(this.TEMP_SONGS_PATH, fileName);

    const lyrics = await this.lyrics.getAndSaveTxtLyrics(
      `${track_info.name} - ${track_info.artists}`,
      tempFilePath.replace(".mp3", ".txt")
    );

    track_info.artists = track_info.artists.split(", ");

    try {
      const result = await this.spotifyDownloader.downloadTrackFromInfo(
        track_info,
        tempFilePath
      );

      console.log("Download result", result);

      if (result.error) {
        throw new Error(`Error while downloading ${track_info.name}`);
      }

      const moveSong = await this.moveSongToFinalPath(fileName, track_info);

      if (!moveSong) {
        return Download_Queue.update(
          { status: config.QUEUE_STATUS.ERROR },
          {
            where: {
              id: track_info.id,
            },
          }
        );
      }

      await Download_Queue.update(
        { status: config.QUEUE_STATUS.FINISHED },
        {
          where: {
            id: track_info.id,
          },
        }
      );

      track_info.artists = track_info.artists.join(", ");
      if (result.youtube_url) {
        track_info.youtube_id = await youtubeUrlToYoutubeId(
          result.youtube_url
        );
      }
      await Track.create({
        ...track_info,
        path: await path.join(
          this.FINAL_PATH,
          track_info.artists.split(", ")[0],
          track_info.album_name,
          `${track_info.name} - ${track_info.artists}.mp3`
        ),
      });

      console.log(`Sucessfully downloaded ${track_info.name}\n`);
    } catch (error) {
      console.error(
        `Error while downloading ${
          track_info.name
        } - ${track_info.artists.join(", ")}`,
        error
      );

      await Download_Queue.update(
        { status: config.QUEUE_STATUS.ERROR },
        {
          where: {
            id: track_info.id,
          },
        }
      );

      return {
        error: true,
        track: track_info.name + " - " + track_info.artist,
      };
    }

    this.IS_QUEUE_DOWNLOADING = false;
    this.downloadQueue();
  }

  async getTrackFromYoutubeId(youtube_id) {
    let repYt = await ytdl.getBasicInfo(youtube_id);

    let details = repYt.videoDetails;
    let title = cleanVideoTitle(details.title, details.author.name);
    let track_data = {
      source: "youtube",
      name: title,
      artists: [details.author.name],
      album_name: title,
      release_date: details.uploadDate.split("T")[0],
      cover_url: details.thumbnails[details.thumbnails.length - 1].url,
      track_number: 1,
      youtube_id,
      youtube_url: `https://www.youtube.com/watch?v=${youtube_id}`,
      spotify_id: null,
    };

    return track_data;
  }

  async downloadFromDatas(track_data, user_id = null) {
    return await this.addSongToQueue(track_data, user_id);
  }

  async downloadFromSpotifyId(spotify_id, user_id = null) {
    let track_data = await this.spotifyDownloader.getTrack(spotify_id);

    return await this.addSongToQueue(track_data, user_id);
  }
}
