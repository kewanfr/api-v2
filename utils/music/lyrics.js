import { JSDOM } from "jsdom";
import fs from "fs";
import LyricsGeniusFunctions from "./lyricsGenius.js";
import { fetchJSON, fetchPage } from "../functions.js";
import config from "../../config.js";
import Lyrics from "../../models/Lyrics.js";
import path from "path";

function findLyricsCommentNode(dom) {
  const iterator = dom.window.document.createNodeIterator(
    dom.window.document.body,
    dom.window.NodeFilter.SHOW_COMMENT,
    null
  );
  let currentNode;
  while ((currentNode = iterator.nextNode())) {
    if (currentNode.nodeValue.includes("Usage of azlyrics.com content")) {
      return currentNode;
    }
  }
  return null;
}

class LyricsFunctions {
  constructor() {
    this.AZ_SUGGEST_URL = "https://search.azlyrics.com/suggest.php";

    this.lyricsGenius = new LyricsGeniusFunctions();
  }

  async search(query) {
    let url = `${this.AZ_SUGGEST_URL}?q=${query}`;
    let response = await fetchJSON(url);

    if (response.error) {
      return response.error;
    }

    if (!response.songs || response.songs.length === 0) {
      return [];
    }

    return response.songs;
  }

  async getLyricsFromURL(url) {
    if (!url || url.length === 0) {
      throw new Error("No URL provided.");
    }

    const response = await fetchPage(url);

    const dom = new JSDOM(response);
    const commentNode = findLyricsCommentNode(dom);
    if (commentNode) {
      // Les paroles devraient être dans le premier élément `div` suivant le commentaire
      const lyricsDiv =
        commentNode.nextSibling.nodeType === 3 // Si le suivant immédiat est un noeud de texte (espace blanc probablement),
          ? commentNode.nextSibling.nextSibling // passez au suivant
          : commentNode.nextSibling;

      if (lyricsDiv) {
        return lyricsDiv.parentElement.textContent.trim();
      }
      return "No lyrics found.";
    }
    return "No lyrics found.";
  }

  async getLyricsAndDB(query) {
    let items = await this.search(query);

    if (items.length === 0) {
      let geniusLyrics = await this.lyricsGenius.getLyrics(query);

      if (geniusLyrics !== "No lyrics found.") {
        return geniusLyrics;
      }
      return "No lyrics found.";
    }

    const item = items[0];

    const itemName = item.autocomplete
      .replaceAll('" ', "")
      .replaceAll('"', "");
    const songName = itemName.split(" - ")[0];
    const artistsName = itemName.split(" - ")[1];

    const fileName = `${songName} - ${artistsName}.txt`;
    const lyricsPath = path.join(config.music.paths.final, "lyrics");
    if (!fs.existsSync(lyricsPath)) {
      fs.mkdirSync(lyricsPath);
    }
    const filePath = path.join(lyricsPath, fileName);

    let lyrics = await this.getLyricsFromURL(items[0].url);

    if (lyrics !== "No lyrics found.") {
      fs.writeFileSync(filePath, lyrics);
      await Lyrics.findOrCreate({
        where: {
          name: songName,
          artists: artistsName,
          album_name: "lyrics",
        },
        defaults: {
          name: songName,
          artists: artistsName,
          album_name: "lyrics",
          path: path.join("lyrics", fileName),
        },
      });

      return lyrics;
    }

    return lyrics;
  }

  async getLyrics(query) {
    let items = await this.search(query);

    if (items.length === 0) {
      let geniusLyrics = await this.lyricsGenius.getLyrics(query);
      if (geniusLyrics !== "No lyrics found.") {
        return geniusLyrics;
      }
      return "No lyrics found.";
    }

    let lyrics = await this.getLyricsFromURL(items[0].url);

    return lyrics;
  }

  async getAndSaveTxtLyrics(query, fileName) {
    let lyrics = await this.getLyrics(query);

    if (lyrics !== "No lyrics found.") {
      fs.writeFileSync(fileName, lyrics);
      return fileName;
    }

    return false;
  }
}

export default LyricsFunctions;
