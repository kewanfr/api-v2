import fs, { readdir } from "fs";
import config from "../../config.js";
import Lyrics from "../../models/Lyrics.js";
import { Op } from "sequelize";

class LyricsDatabase {
  constructor() {
    this.TEMP_SONGS_PATH = config.music.paths.temp_songs;
    this.TEMP_COVERS_PATH = config.music.paths.temp_covers;
    this.FINAL_PATH = config.music.paths.final;
  }

  async getAllLyrics() {
    const lyricsDB = await Lyrics.findAll({
      attributes: ["id", "name", "artists"],
    });

    return lyricsDB;
  }

  async indexLyricsFiles() {
    const path = this.FINAL_PATH;
    console.log(this.FINAL_PATH);

    let artists_folders = await fs.readdirSync(this.FINAL_PATH, {
      withFileTypes: true,
    });

    // filter if no extension
    artists_folders = artists_folders.filter(
      (folder) => !folder.name.includes(".")
    );

    for (let artistDat of artists_folders) {
      const artist = artistDat.name;
      let albums_folders = await fs.readdirSync(`${path}/${artist}`, {
        withFileTypes: true,
      });

      // filter if no extension
      albums_folders = albums_folders.filter(
        (folder) => !folder.name.includes(".")
      );

      for (let albumDat of albums_folders) {
        const album = albumDat.name;
        const songs = fs.readdirSync(`${path}/${artist}/${album}`, {
          withFileTypes: true,
        });

        for (let song of songs) {
          if (song.name.endsWith(".txt")) {
            const songName = song.name
              .replaceAll("...", "")
              .replaceAll("..", "")
              .split(".txt")[0]
              .split(" - ")[0];
            const artistsName = song.name
              .replaceAll("...", "")
              .replaceAll("..", "")
              .split(".txt")[0]
              .split(" - ")[1];
            const albumName = album;

            // console.log(songName, artistsName, albumName);

            await Lyrics.findOrCreate({
              where: {
                name: songName,
                artists: artistsName,
                album_name: albumName,
              },
              defaults: {
                name: songName,
                artists: artistsName,
                album_name: albumName,
                path: `${artist}/${album}/${song.name}`,
              },
            });
          }
        }
      }
    }
  }

  async readLyricsFile(path) {
    const lyrics = fs.readFileSync(`${this.FINAL_PATH}/${path}`, "utf8");

    return lyrics;
  }

  async getLyrics(id) {
    const lyricsData = await Lyrics.findByPk(id);

    if (!lyricsData) {
      return null;
    }
    const lyrics = await fs.readFileSync(
      `${this.FINAL_PATH}/${lyricsData.path}`,
      "utf8"
    );
    return lyrics;
  }

  async search(query) {

    const allLyrics = await Lyrics.findAll({
      attributes: ["id", "name", "artists", "path"],
    });

    const queryWords = query.replace(" - ", "  ").split(" ");

    const results = allLyrics.filter((lyrics) => {
      const name = lyrics.name.toLowerCase();
      const artists = lyrics.artists.toLowerCase();

      return queryWords.every(
        (word) =>
          name.includes(word.toLowerCase()) ||
          artists.includes(word.toLowerCase())
      );
    });

    return results;

  }
}

export default LyricsDatabase;
