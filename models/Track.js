import Sequelize from 'sequelize';
import sequelize from './database.js';

const Track = sequelize.define(
  "tracks",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    // Can be spotify or youtube
    // origin: {
      
    // }
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
      allowNull: true,
    },
    path: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }
);

export default Track;