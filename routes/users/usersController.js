import { Op } from "sequelize";
import User from "../../models/User.js";

export const getUserHandler = async (req, reply) => {
  const user = req.user;

  const dbUser = await User.findOne({
    where: {
      [Op.and]: [{ id: user.id }, { username: user.username }],
    },
  });

  if (!dbUser) {
    return reply.code(404).send({ message: "User not found" });
  }

  return dbUser.dataValues;
};

export const getAllUsersHandler = async (req, reply) => {
  const users = await User.findAll();
  return users;
};

export const getUser = async (req, reply) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }
  return user;
};

export const updateUser = async (req, reply) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }

  if (!req.body.username && !req.body.email && !req.body.role) {
    return reply.code(400).send({ message: "Missing required fields" });
  }

  if (req.body.username) {
    user.username = req.body.username;
  }

  if (req.body.email) {
    user.email = req.body.email;
  }

  if (req.body.role) {
    user.role = req.body.role;
  }

  await user.save();

  return user;
};

export const deleteUser = async (req, reply) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }

  await user.destroy();

  return { message: "User deleted" };
};
