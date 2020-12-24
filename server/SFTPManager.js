// import Client from 'ssh2-sftp-client';
let Client = require('ssh2-sftp-client');


class SFTPManager {
    constructor(login) {
        this.queue = [];
        this.sftp = new Client();
        this.login = login;
        this.connected = false;
    }

    async processAction(action) {
        switch (action.type) {
            case 'put':
                return await this.sftp.put(action.local, action.remote);
            case 'delete':
                return await this.sftp.delete(action.remote);
            case 'fastPut':
                return this.sftp.fastPut(
                    action.local,
                    action.remote,
                    {
                        autoClose: false,
                        step: action.progress
                    }
                )
            case 'mkdir':
                return await this.sftp.mkdir(action.remote);
            case 'rmdir':
                return await this.sftp.rmdir(action.remote);
            default:
                break;
        }
    }

    async processQueue() {
        console.log(this.queue.length, this.connected);

        await this.sftp.connect(this.login);

        let a = this.queue.shift();
        console.log(a.action.type, a.action.remote);
        try {
            await this.processAction(a.action);
        } catch (e) {
            console.log("ERRR", e);
        }
        a.resolve();


        console.log(this.queue);
        this.sftp.end()

        if (this.queue.length !== 0)
            this.processQueue();
    }
    add(action) {
        return new Promise((resolve) => {
            this.queue.push({ action: action, resolve: resolve });
            this.processQueue();
        })

    }

}

module.exports = SFTPManager;