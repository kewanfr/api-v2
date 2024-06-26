import Sequelize from "sequelize";
import sequelize from "./database.js";

const Lyrics = sequelize.define("lyrics", {
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
    type: Sequelize.STRING, // List of artists, separated by ","
    allowNull: true,
  },
  album_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  path: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

export default Lyrics;
