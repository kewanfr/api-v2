// dotenv
import dotenv from "dotenv";
dotenv.config();

export default {
  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  server: {
    host: process.env.HOST ?? "localhot",
    port: process.env.PORT ?? 3000,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: 3 * 86400, // 3 days
  },

  https: {
    enabled: process.env.HTTPS_ENABLED === "true",
    key: process.env.HTTPS_KEY_PATH ?? "",
    cert: process.env.HTTPS_CERT_PATH ?? "",
  },
  music: {
    spotify_client_id: process.env.SPOTIFY_CLIENT_ID,
    spotify_client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    youtube_cookie: process.env.YOUTUBE_COOKIES,

    paths: {
      temp_songs: process.env.TEMP_SONGS_PATH ?? "./temp/songs",
      temp_covers: process.env.TEMP_COVERS_PATH ?? "./temp/covers",
      final: process.env.FINAL_SONGS_PATH ?? "./songs/",
    },
  },

  plex: {
    url: process.env.PLEX_URL,
    username: process.env.PLEX_USERNAME,
    password: process.env.PLEX_PASSWORD,
    deviceName: "Plex Music API",
    distantUrl: process.env.PLEX_DISTANT_URL ?? process.env.PLEX_URL,
  },

  QUEUE_STATUS: {
    PENDING: 0,
    DOWNLOADING: 1,
    FINISHED: 2,
    ERROR: 3,
    CANCELLED: 4,
    ALREADY_IN_QUEUE: 5,
  },
};