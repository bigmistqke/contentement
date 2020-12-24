import http from 'http';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import fs, { promises as fsp } from 'fs';
import path from 'path';

import optimizeMedia from './optimizeMedia.mjs'
import ffmpegProgress from './ffmpegProgress.mjs'

import SFTPManager from './SFTPManager.mjs'



const Api = express();
const HTTP = http.Server(Api);

const _sftp = {
    login: {
        host: 'post-neon.transurl.nl',
        username: 'post-neon.com',
        password: 'Lifeisasimulation4'
    },
    root: 'www',
    base: 'http://www.post-neon.com/'
}

const sftpManager = new SFTPManager(_sftp.login, _sftp.root);


Api.use(cors());
Api.use(bodyParser.urlencoded({ extended: true }));
Api.use(bodyParser.json());

let inProgress = {
    resize: false,
    upload: false
}

const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

Api.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    next();
});

Api.get("/", (req, res) => {
    res.status(200).send("ok");
})

Api.get('/fetch', (req, res) => {
    fetch('http://www.post-neon.com/JSON/data.json')
        .then(res => { return res.json() })
        .then((json) => {
            res.send(json);
        })
});



Api.post('/save', (req, res) => {
    let data = req.body;
    fsp.writeFile("./temp/data.json", JSON.stringify(data), () => { }).then(() => {
        return sftpManager.add({ type: 'put', local: "./temp/data.json", remote: `${_sftp.root}/JSON/data.json` });
    }).then((e) => {
        res.send('saved');
    }).catch((err) => {
        res.sendStatus(404);
    })
})

Api.post('/resize', (req, res) => {
    inProgress.resize = true;
    let media = req.body;
    optimizeMedia(media).then(() => {
        if (media.type === 'image') {
            inProgress.resize = false;
        };
        res.send({ status: 'ok' });
    });
});



Api.post('/delete', (req, res) => {
    let _data = req.body;
    let _media = _data.media;


    let remote_path = `${_sftp.root}/projects/${_data.project}/${capitalize(_media.type)}/desktop/${_media.src}`;
    sftpManager.add({ type: 'delete', remote: remote_path }).then(() => {
        let remote_path = `${_sftp.root}/projects/${_data.project}/${capitalize(_media.type)}/mobile/${_media.src}`;
        return sftpManager.add({ type: 'delete', remote: remote_path })
    }).then(() => {
        res.send('deleted');
    }).catch((err) => {
        res.sendStatus(404);
    })
})

Api.post('/progressUpload', (req, res) => {
    let src = req.body.src;
    let basename = path.parse(src).name;
    let progress_path = `./progress/${basename}_upload.txt`;
    fsp.readFile(progress_path, "utf8").then(content => {
        if (!content) res.send({ status: 'uploading', percent: 0 });
        content = JSON.parse(content);
        let status = content.percent > 99 ? 'end' : 'uploading';
        res.send({ status: status, percent: content.percent, format: content.format })
    }).catch((err) => {
        res.send({ status: 'uploading', percent: 0 });
    })
})

const progressUpload = (basename, progress, filesize, format) => {
    let percent = Math.round(progress / filesize * 100 * 100) / 100;
    let data = { percent: percent, format: format };
    let progress_path = `./progress/${basename}_upload.txt`;

    fsp.writeFile(progress_path, JSON.stringify(data))
        .then(() => { })
        .catch((err) => { console.log('write err', err) });
}

const uploadMedia = async (_media, format) => {
    let local_path = `./temp/${format}/${_media.src}`
    let remote_path = `${_sftp.root}/projects/${_media.project}/${capitalize(_media.type)}/${format}/${_media.src}`;
    let basename = path.parse(_media.src).name;
    var filesize = fs.statSync(local_path).size;
    try {
        await sftpManager.add({ type: 'fastPut', local: local_path, remote: remote_path, media_type: _media.type, progress: (p) => { progressUpload(basename, p, filesize, format) } })
    } catch (e) {
        console.log('sftp error', e);
    } finally {
        console.log("FINISH IIIIIIIIIT");
        let progress_path = `./progress/${basename}_upload.txt`;
        fsp.writeFile(progress_path, JSON.stringify({ percent: 100, format: format }));
        // delete temp ile
        fs.unlinkSync(local_path);
        return;
    }
}

Api.post('/upload', (req, res) => {
    let _media = req.body;

    inProgress.upload = true;
    uploadMedia(_media, 'desktop').then(() => {
        return uploadMedia(_media, 'mobile');
    }).then(() => {
        inProgress.upload = false;
        res.send({ sucess: true });
    }).catch((err) => {
        inProgress.upload = false;
        res.send({ sucess: false, error: err });
    })
})

Api.post('/progressResize', (req, res) => {
    let _src = req.body.src;
    ffmpegProgress(_src).then((progress) => {
        if (progress.completed) {
            inProgress.resize = false;
        };
        res.send(progress);
    })
})

Api.post('/addProject', (req, res) => {
    let _project = req.body.project;
    let _base = `${_sftp.root}/projects/${_project}`;
    let remote_path = _base;
    sftpManager.add({ type: 'mkdir', remote: remote_path }).then(() => {
        let remote_path = `${_base}/Image`;
        return sftpManager.add({ type: 'mkdir', remote: remote_path });
    }).then(() => {
        let remote_path = `${_base}/Image/mobile`;
        return sftpManager.add({ type: 'mkdir', remote: remote_path });
    }).then(() => {
        let remote_path = `${_base}/Image/desktop`;
        return sftpManager.add({ type: 'mkdir', remote: remote_path });
    }).then(() => {
        let remote_path = `${_base}/Video`;
        return sftpManager.add({ type: 'mkdir', remote: remote_path });
    }).then(() => {
        let remote_path = `${_base}/Video/mobile`;
        return sftpManager.add({ type: 'mkdir', remote: remote_path });
    }).then(() => {
        let remote_path = `${_base}/Video/desktop`;
        return sftpManager.add({ type: 'mkdir', remote: remote_path });
    }).then(() => {
        res.send('project added');
    }).catch((err) => {
        res.send(err);
    })
})

Api.post('/deleteProject', (req, res) => {
    let _project = req.body.project;
    let _base = `${_sftp.root}/projects/${_project}`;
    sftpManager.add({ type: 'rmdir', remote: _base }).then(() => {
        res.send('project deleted');
    }).catch(() => {
        res.sendStatus(404);
    })
})


HTTP.listen(9002, () => {
    console.log('listening on *:9002');
});