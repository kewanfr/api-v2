import Sequelize from 'sequelize';
import sequelize from './database.js';

const User = sequelize.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },

  password: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  role: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "user",
  },
});

export default User;