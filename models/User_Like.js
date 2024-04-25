import Sequelize from 'sequelize';
import sequelize from './database.js';
import User from './User.js';
import Track from './Track.js';


const User_Like = sequelize.define(
  "user_likes",
  {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    track_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },

  }, {}
);

// foreign key
User_Like.belongsTo(User, { foreignKey: 'user_id' });
User_Like.belongsTo(Track, { foreignKey: 'track_id' });



export default User_Like;