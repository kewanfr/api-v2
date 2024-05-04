import Sequelize from 'sequelize';
import sequelize from './database.js';
import User from './User.js';
import Track from './Track.js';


const Download_Queue = sequelize.define(
  "download_queue",
  {
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
      unique: true,
      allowNull: true,
    },
    youtube_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    spotify_url: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    status: {
      type: {
        type: Sequelize.ENUM,
        values: [0, 1, 2, 3, 4], // ['pending', 'downloading', 'finished', 'error', 'cancelled']
      },
      defaultValue: 0,
      allowNull: false,
    },
  },
  {}
);

Download_Queue.belongsTo(User, { foreignKey: "user_id" });

export default Download_Queue;