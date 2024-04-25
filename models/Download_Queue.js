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
      type: Sequelize.ARRAY(Sequelize.STRING),
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
    spotify_url: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    youtube_url: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    status: {
      type: Sequelize.STRING,
      allowNull: false,
    },

  }, {}
);

export default Download_Queue;