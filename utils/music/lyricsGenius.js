import { JSDOM } from "jsdom";
import fs from "fs";
import { fetchJSON, fetchPage } from "../functions.js";

class LyricsGeniusFunctions {
  constructor() {
    this.QUERY_URL = "https://genius.com/api/search/song?page=1&q=";
  }

  async search(query) {
    let url = `${this.QUERY_URL}${query}`;
    let response = await fetchJSON(url);

    if (response.error) {
      return response.error;
    }

    const hits = response.response.sections[0]?.hits;
    if (!hits || hits.length === 0) {
      return [];
    }

    let songs = await hits.map((hit) => {
      return {
        type: hit.type,
        title: hit.result.title,
        artist_names: hit.result.artist_names,
        artist: hit.result.primary_artist.name,
        artists: hit.result.featured_artists.map((artist) => artist.name),
        url: hit.result.url,
        cover: hit.result.song_art_image_url,
      };
    });

    return songs;
  }

  async cleanHtmlLinks(html) {
    return html.replaceAll(/<a[^>]*>([^<]+)<\/a>/g, "$1");
  }

  async cleanHtmlTags(html) {
    return html.replaceAll(/<[^>]*>/g, "");
  }

  async getLyricsFromURL(url) {
    if (!url || url.length === 0) {
      throw new Error("No URL provided.");
    }

    const response = await fetchPage(url);

    if (!response) {
      return "No lyrics found.";
    }

    const dom = new JSDOM(response);
    // className starts with "Lyrics__Container"
    const lyricsNodes = dom.window.document.querySelectorAll(
      "[class^=Lyrics__Container]"
    );

    if (!lyricsNodes || lyricsNodes.length === 0) {
      return "No lyrics found.";
    }

    const lyrics = [];

    lyricsNodes.forEach((node) => {
      const lyricsHTML = node.innerHTML;

      const lyricsText = lyricsHTML
        .replace(/<br>/g, "\n")
        .replaceAll(/<a[^>]*>([^<]+)<\/a>/g, "$1")
        .replaceAll(/<[^>]*>/g, "");

      lyrics.push(lyricsText);
    });

    if (!lyrics || lyrics.length === 0) {
      return "No lyrics found.";
    }

    return lyrics.join("\n");
  }

  async getLyrics(query) {
    let items = await this.search(query);

    if (items.length === 0) {
      return "No lyrics found.";
    }

    let lyrics = await this.getLyricsFromURL(items[0].url + "?bagon=1");

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

export default LyricsGeniusFunctions;
