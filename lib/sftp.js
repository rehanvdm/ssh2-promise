"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const BaseSFTP_1 = __importDefault(require("./BaseSFTP"));
var stringFlagMap = ['r', 'r+', 'w', 'wx', 'xw', 'w+', 'wx+', 'xw+', 'a', 'ax', 'xa', 'a+', 'ax+', 'xa+'];
var methods = ["fastGet", "fastPut", "open", "close", "readFile", "writeFile", "read", "write", "fstat", "fsetstat", "futimes", "fchown", "fchmod", "opendir", "readdir", "unlink", "rename", "mkdir", "rmdir", "stat", "lstat", "setstat", "utimes", "chown", "chmod", "readlink", "symlink", "realpath", "ext_openssh_rename", "ext_openssh_statvfs", "ext_openssh_fstatvfs", "ext_openssh_hardlink", "ext_openssh_fsync"];
var enhanceMethods = { "readFileData": "read", "writeFileData": "write", "getStat": "fstat", "setStat": "fsetstat", "changeTimestamp": "futimes", "changeOwner": "fchown", "changeMode": "fchmod" };
class SFTP extends BaseSFTP_1.default {
    constructor(ssh) {
        super();
        this.ssh = ssh;
        methods.forEach((m) => {
            this[m] = function () {
                var params = [...arguments];
                return new Promise((resolve, reject) => {
                    params.push(function (err, ...results) {
                        if (err)
                            return reject(err);
                        return (results && results.length == 1) ? resolve(results[0]) : resolve(results);
                    });
                    this.ssh.rawSFTP().then((sftp) => {
                        sftp[m].apply(sftp, params);
                    });
                });
            }.bind(this);
        });
        Object.keys(enhanceMethods).forEach((m) => {
            this[m] = function () {
                var params = [...arguments];
                var path = params[0];
                var flag = "r+";
                if (params[1] && stringFlagMap.indexOf(params[1]) >= 0) {
                    flag = params[1];
                    params = params.slice(2);
                }
                else {
                    params = params.slice(1);
                }
                return this.open(path, flag).then((handle) => {
                    return this[enhanceMethods[m]].apply(this, [handle].concat(params)).then((data) => {
                        this.close(handle);
                        return data;
                    }, (err) => {
                        this.close(handle);
                        return Promise.reject(err);
                    });
                });
            };
        });
    }
    createReadStream(path, options) {
        var params = [...arguments];
        return this.ssh.rawSFTP().then((sftp) => {
            return sftp.createReadStream.apply(sftp, params);
        });
    }
    createWriteStream(path, options) {
        var params = [...arguments];
        return this.ssh.rawSFTP().then((sftp) => {
            return sftp.createWriteStream.apply(sftp, params);
        });
    }
}
module.exports = SFTP;
