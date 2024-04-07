import { Op } from "sequelize";
import User from "../../models/User.js";
import bcrypt from "bcrypt";
import signToken from "../../utils/signToken.js";

export const authLoginHandler = async (req, reply) => {
  if (!req.body || !req.body.login || !req.body.password) {
    return reply.code(400).send({ message: "Missing required fields" });
  }

  const { login, password } = req.body;

  // include password
  const user = await User.findOne({
    where: {
      [Op.or]: [{ username: login }, { email: login }],
    },
    attributes: { include: ["password"] },
  });

  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return reply.code(401).send({ message: "Invalid password" });
  }

  const data = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const token = await signToken(data);

  if (!token) {
    return reply.code(500).send({ message: "Error signing token" });
  }

  return reply.send({
    id: user.id,
    username: user.username,
    role: user.role,
    token,
  });
};

export const authRegisterHandler = async (req, reply) => {
  if (
    !req.body ||
    !req.body.username ||
    !req.body.email ||
    !req.body.password
  ) {
    return reply.code(400).send({ message: "Missing required fields" });
  }
  const { username, email, password } = req.body;

  // Check if user already exists (username or email)
  const userExists = await User.findOne({
    where: {
      [Op.or]: [{ username }, { email }],
    },
  });

  if (userExists) {
    return reply.code(400).send({ message: "User already exists" });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  return user;
};

export const getUserHandler = async (req, reply) => {
  const { user } = req;
  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }

  const dbUser = await User.findOne({
    where: {
      [Op.and]: [{ id: user.id }, { username: user.username }],
    },
  });

  if (!dbUser) {
    return reply.code(404).send({ message: "User not found" });
  }

  delete dbUser.dataValues.password;

  return dbUser.dataValues;
};