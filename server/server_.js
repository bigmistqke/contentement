import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { join } from 'path';
import shell from 'any-shell-escape';
import { exec } from 'child_process';

const Api = express();
const HTTP = http.Server(Api);

Api.use(cors());
Api.use(bodyParser.urlencoded({ extended: true }));
Api.use(bodyParser.json());

Api.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    next();
});

Api.get('/test', (req, res) => res.status(200).send('succsess!'));

Api.get('/fetch', (req, res) => {
    fetch('http://www.post-neon.com/JSON/scene.json')
        .then(res => { return res.json() })
        .then((json) => {
            res.send(json);
        })
});

Api.get("/", (req, res) => {
    res.status(200).send("ok");
})

Api.post('/resize', (req, res) => {
    console.log(req);
    let path = req.body.path;
    /*     const makeMp4 = shell([
            'ffmpeg', '-y', '-v', 'error',
            '-i', join(process.cwd(), path),
            '-acodec', 'mp3',
            '-vcodec', 'libx264',
            join(process.cwd(), './test.mp4')
        ])
    
        exec(makeMp4, (err) => {
            if (err) {
                console.error(err)
                process.exit(1)
            } else {
                console.info('done!')
            }
        }) */
    res.status(200).send(path);
});

HTTP.listen(9002, () => {
    console.log('listening on *:9001');
});