import fs from "fs";
import packageJson from "../package.json" assert { type: "json" };

export const getDirectories = async (source) => {
  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

export const getFiles = async (source) => {
  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);
};

export const ensureDir = async (dir) => {
  if (!fs.existsSync(dir)) {
    return await fs.mkdirSync(dir, { recursive: true });
  }
  return true;
};

export const getProjectVersion = () => {
  return packageJson.version;
};

