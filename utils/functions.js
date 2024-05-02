import fs from "fs";
import packageJson from "../package.json" assert { type: "json" };
import yts from "yt-search";

export const getDirectories = async (source) => {
  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

export const getFiles = async (source) => {
  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);
};

export const cleanName = (str) =>
  str
    .replace(":", "-")
    .replace("\\", "-")
    .replace("/", "-")
    .replace("?", "")
    .replace(".", "");

export const ensureDir = async (dir) => {
  if (!fs.existsSync(dir)) {
    return await fs.mkdirSync(dir, { recursive: true });
  }
  return true;
};

export const getProjectVersion = () => {
  return packageJson.version;
};

export const searchYt = async (term, limit = 1) => {
  const { videos } = await yts.search(term);
  return videos.slice(0, limit);
};

export const getYtLink = async (term) => {
  const { videos } = await yts.search(term);
  if (!videos || videos.length === 0) return "";
  return videos.filter((video) => video.seconds < 3600)[0].url;
};

/**
 * Parse the track result of a search
 * @param {*} data
 * @returns
 */
export const parseTrackResult = async (data, { searchYoutube = false }) => {
  return {
    name: cleanName(data.name),
    artist: data.artists.map((a) => cleanName(a.name)).join(" / "),
    artists: data.artists.map((a) => cleanName(a.name)),
    artists_ids: data.artists.map((a) => a.id),
    album_name: data.album?.name,
    release_date: data.album?.release_date ?? "Unknown",
    cover_url: data.album?.images[0]?.url,
    track_number: data.track_number,

    duration_ms: data.duration_ms,

    spotify_id: data.id,
    spotify_url: data.external_urls.spotify,
    youtube_url: searchYoutube
      ? await getYtLink(
          `${data.name} ${data.artists.map((a) => a.name).join(" ")}`
        )
      : null,

    preview_url: data.preview_url,
  };
};

/**
 * Parse the album result of a search
 * @param {*} data
 * @returns
 */
export const parseAlbumResult = async (data) => {
  return {
    name: cleanName(data.name),
    artists: data.artists.map((a) => a.name),
    release_date: data.release_date,
    cover_url: data.images[0].url,

    type: data.album_type,

    spotify_id: data.id,
    spotify_url: data.external_urls.spotify,
  };
};

/**
 * Parse the artist result of a search
 * @param {*} data
 * @returns
 */
export const parseArtistResult = async (data) => {
  return {
    name: cleanName(data.name),
    genres: data.genres?.join(", "),

    popularity: data.popularity,
    followers: data.followers.total,
    image_url: data.images[0]?.url,

    spotify_id: data.id,
    spotify_url: data.external_urls.spotify,
  };
};
