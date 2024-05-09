import config from "../../config.js";
import fs from "fs";

import { exec } from "child_process";

export class fileSystem {
  constructor() {
    this.TEMP_SONGS_PATH = config.music.paths.temp_songs;
    this.TEMP_COVERS_PATH = config.music.paths.temp_covers;
    this.FINAL_PATH = config.music.paths.final;

    if (!fs.existsSync(this.TEMP_SONGS_PATH)) {
      fs.mkdirSync(this.TEMP_SONGS_PATH, { recursive: true });
    }

    if (!fs.existsSync(this.TEMP_COVERS_PATH)) {
      fs.mkdirSync(this.TEMP_COVERS_PATH, { recursive: true });
    }

    if (!fs.existsSync(this.FINAL_PATH)) {
      fs.mkdirSync(this.FINAL_PATH, { recursive: true });
    }

    const cmdConfig = config.fileSystem.mountCmd;

    this.MOUNT_COMMAND =
      cmdConfig.prefix +
      " " +
      cmdConfig.netdir +
      " " +
      cmdConfig.mountdir +
      " " +
      cmdConfig.options;

    this.UMOUNT_COMMAND = config.fileSystem.umountCmd;

    this.NETWORK_HOST = config.fileSystem.NETWORK_HOST;
    this.NETWORK_DIR = cmdConfig.netdir;
  }

  execLocalCommand(COMMAND) {
    return new Promise((resolve, reject) => {
      exec(COMMAND, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        resolve(stdout);
      });
    });
  }

  execSshCommand(HOST, COMMAND) {
    return new Promise((resolve, reject) => {
      exec(`ssh ${HOST} ${COMMAND}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        resolve(stdout);
      });
    });
  }

  async mountLocal() {
    return new Promise((resolve, reject) => {
      this.execLocalCommand(this.MOUNT_COMMAND)
        .catch((err) => {
          console.error(err);
          resolve(false);
        })
        .then((response) => {
          resolve(response);
        });
    });
  }

  async unMountLocal() {
    return new Promise((resolve, reject) => {
      this.execLocalCommand(this.UMOUNT_COMMAND)
        .catch((err) => {
          console.error(err);
          resolve(false);
        })
        .then((response) => {
          resolve(response);
        });
    });
  }

  async mountPlexServer() {
    return new Promise((resolve, reject) => {
      this.execSshCommand(this.NETWORK_HOST, this.MOUNT_COMMAND)
        .catch((err) => {
          console.error(err);
          resolve(false);
        })
        .then((response) => {
          resolve(response);
        });
    });
  }

  async unMountPlexServer() {
    return new Promise((resolve, reject) => {
      this.execSshCommand(this.NETWORK_HOST, this.UMOUNT_COMMAND)
        .catch((err) => {
          console.error(err);
          resolve(false);
        })
        .then((response) => {
          resolve(response);
        });
    });
  }

  async verifyLocalMount() {
    return new Promise((resolve, reject) => {
      this.execLocalCommand("df -h")
        .catch((err) => {
          console.error(err);
          resolve(false);
        })
        .then((response) => {
          if (response.includes(this.NETWORK_DIR)) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
    });
  }

  async verifyServerMount() {
    return new Promise((resolve, reject) => {
      this.execSshCommand(this.NETWORK_HOST, "df -h")
        .catch((err) => {
          console.error(err);
          resolve(false);
        })
        .then((response) => {
          if (response.includes(this.NETWORK_DIR)) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
    });
  }
}
