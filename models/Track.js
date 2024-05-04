import Sequelize from 'sequelize';
import sequelize from './database.js';
import User from "./User.js";

const Track = sequelize.define("tracks", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  artists: {
    type: Sequelize.STRING, // Array of strings
    allowNull: true,
  },
  album_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  release_date: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  cover_url: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  track_number: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  // Optional external links
  spotify_id: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  youtube_id: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  user_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },

  status: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  path: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

Track.belongsTo(User, { foreignKey: "user_id" });

export default Track;