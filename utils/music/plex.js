import PlexAPI from "plex-api";
import fs from "fs";

const LYBRARY_SECTION_TITLE = "Musique";
import config from "../../config.js";
import { getProjectVersion } from "../functions.js";

const storeFolder = "./store";
if (!fs.existsSync(storeFolder)) {
  fs.mkdirSync(storeFolder);
}

class plexFunctions {
  constructor() {
    this.plexOptions = {
      hostname: config.plex.url,
      username: config.plex.username,
      password: config.plex.password,
      options: {
        identifier: null,
        product: config.plex.deviceName,
        version: getProjectVersion(),
        deviceName: config.DEVICE_NAME,
      },
    };

    this.init();
  }

  async init() {
    this.clientIdentifier = await this.getIdentifierFromStore();

    this.plexOptions.options.identifier = this.clientIdentifier;

    this.plexClient = new PlexAPI(this.plexOptions);

    this.plexClient.query("/").then((result) => {
      // save clientIdentifier in store

      this.clientIdentifier = result.MediaContainer.machineIdentifier;

      this.saveIdentifierToStore(this.clientIdentifier);

      this.scanMusicLibrary();
    });
  }

  async getIdentifierFromStore() {
    try {
      let identifier = await fs.readFileSync(
        `${storeFolder}/plexIdentifier.json`
      );
      if (!identifier) {
        return null;
      }
      if (identifier.length < 2) {
        return null;
      }
      return JSON.parse(identifier).identifier || null;
    } catch (error) {
      return null;
    }
  }

  async saveIdentifierToStore(identifier) {
    await fs.writeFileSync(
      `${storeFolder}/plexIdentifier.json`,
      JSON.stringify({ identifier: identifier })
    );
  }

  async getActualSessions() {
    let sessions = await this.plexClient.query("/status/sessions");

    if (!sessions.MediaContainer?.Metadata) {
      return [];
    }

    return sessions.MediaContainer.Metadata;
  }

  async getActualPlaying() {
    let sessions = await this.getActualSessions();
    if (sessions.length === 0) {
      return null;
    }

    let session = sessions.find(
      (session) => session.librarySectionTitle === LYBRARY_SECTION_TITLE
    );

    if (!session) {
      return null;
    }

    const thumbUrl = this.plexClient._generateRelativeUrl(session.thumb);
    const plexToken = this.plexClient.authToken;
    let playing = {
      id: session.ratingKey,
      key: session.key,
      title: session.title,
      type: session.type,
      user: session.User.title,
      artist: session.grandparentTitle,
      album: session.parentTitle,
      mediaPath: session.Media[0].Part[0].file,
      thumb: thumbUrl + "?X-Plex-Token=" + plexToken,
      player: {
        title: session.Player.title,
        address: session.Player.address,
      },
    };

    return playing;
  }

  async scanMusicLibrary() {

    console.log("Scanning music library");

    let sections = await this.plexClient.query("/library/sections");
    let musicSection = sections.MediaContainer.Directory.find(
      (section) => section.title === LYBRARY_SECTION_TITLE
    );

    if (!musicSection) {
      return null;
    }

    let scan = await this.plexClient.perform(
      `/library/sections/${musicSection.key}/refresh`
    );

    return scan;
  }

  async parseLyricsResponse(response) {
    if (response.length === 0) {
      return null;
    }
    let lines = response[0].Line;
    if (lines.length === 0) {
      return null;
    }

    return lines
      .map((line) => {
        return line.Span ? line.Span.map((span) => span.text).join(" ") : "\n";
      })
      .join("\n");
  }

  async getMetadataFromID(id) {
    let metadata = await this.plexClient.query(`/library/metadata/${id}`);

    const streams =
      metadata.MediaContainer?.Metadata[0]?.Media[0]?.Part[0]?.Stream;

    const lyricsStream = streams.find((stream) => stream.codec === "txt");

    if (!lyricsStream) {
      return null;
    }

    return lyricsStream;
  }

  async getActualPlayingMetadata() {
    let playing = await this.getActualPlaying();
    if (!playing) {
      return null;
    }

    return await this.getMetadataFromID(playing.id);
  }

  async getLyricsFromSongID(songId) {
    let metadata = await this.getMetadataFromID(songId);

    if (!metadata) {
      return null;
    }

    let lyrics = await this.plexClient.query(metadata.key);

    if (!lyrics || !lyrics.MediaContainer?.Lyrics) {
      return null;
    }

    return await this.parseLyricsResponse(lyrics.MediaContainer.Lyrics);
  }

  async getActualPlayingLyrics() {
    let playing = await this.getActualPlaying();
    if (!playing) {
      return null;
    }

    return {
      playing: playing,
      lyrics: await this.getLyricsFromSongID(playing.id),
    };
  }
}

export default plexFunctions;
