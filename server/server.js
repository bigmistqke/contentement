let http = require('http');
let path = require('path');
let favicon = require('serve-favicon');
let join = path.join;
let express = require('express');
let cors = require('cors');
let fetch = require('node-fetch');
let bodyParser = require('body-parser');
let fs = require('fs');
let fsp = fs.promises;
let optimizeMedia = require('./optimizeMedia.js');
let ffmpegProgress = require('./ffmpegProgress.js');
let SFTPManager = require('./SFTPManager.js');

const LoginDetails = require('./LoginDetails');


const Api = express();
const HTTP = http.Server(Api);

Api.use(express.static(join(__dirname, '..', 'public')));
// Api.use(favicon(join(__dirname, '..', 'public/favicon.ico')));

const _sftp = new LoginDetails();

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
    console.log(`${_sftp.base}/JSON/data.json`);
    fetch(`${_sftp.base}/JSON/data.json`)
        .then(res => { return res.json() })
        .then((json) => {
            res.send(json);
        })
});



Api.post('/save', (req, res) => {
    let data = req.body;
    let local_path = join(__dirname, 'temp', 'data.json');
    let remote_path = `${_sftp.root}/JSON/data.json`;
    fsp.writeFile(local_path, JSON.stringify(data), () => { }).then(() => {
        return sftpManager.add({ type: 'put', local: local_path, remote: remote_path });
    }).then((e) => {
        res.send('saved');
    }).catch((err) => {
        res.send(err);
        // res.sendStatus(404);
    })
})

Api.post('/resize', (req, res) => {
    inProgress.resize = true;
    let media = req.body;
    optimizeMedia(media).then(() => {
        if (media.type === 'image') {
            inProgress.resize = false;
        };
        res.send({ status: 'ok', media: media });
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
    // let progress_path = `./progress/${basename}_upload.txt`;
    let progress_path = join(__dirname, 'progress', `${basename}_upload.txt`);

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
    // let progress_path = `${__dirname}/progress/${basename}_upload.txt`;
    let progress_path = join(__dirname, 'progress', `${basename}_upload.txt`);

    fsp.writeFile(progress_path, JSON.stringify(data))
        .then(() => { })
        .catch((err) => { console.log('write err', err) });
}

const uploadMedia = async (_media, format) => {
    let local_path = join(__dirname, 'temp', format, _media.src);

    let remote_path = `${_sftp.root}/projects/${_media.project}/${capitalize(_media.type)}/${format}/${_media.src}`;
    // console.log(_sftp.root, remote_path);
    let basename = path.parse(_media.src).name;
    var filesize = fs.statSync(local_path).size;
    try {
        await sftpManager.add({ type: 'fastPut', local: local_path, remote: remote_path, media_type: _media.type, progress: (p) => { progressUpload(basename, p, filesize, format) } })
    } catch (e) {
        console.log('sftp error', e);
    } finally {
        console.log("FINISH IIIIIIIIIT");
        let progress_path = `${__dirname}/progress/${basename}_upload.txt`;
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
    sftpManager.add({ type: 'rmdir', remote: _base })
        .then(() => {
            console.log('delete ')
            res.send('project deleted');
        }).catch((e) => {
            console.log("ERRRORRR", e)
            res.send(e);
        })
})


HTTP.listen(9002, () => {
    console.log('listening on *:9002');
});