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
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    artists: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    album_artist: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    album_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    cover: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    path: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    track_position: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    lyrics: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    },
  }
);

export default Track;