/* 
import { join } from 'path';
import { spawn } from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import sharp from 'sharp'; */


let { join } = require('path');
let { spawn } = require('child_process');
let pathToFfmpeg = require('ffmpeg-static');
let sharp = require('sharp');
let PATH = require('path');


const getPowOfTwo = (dim, format) => {
    let powOfTwo = format === 'desktop' ? [2048, 1024, 512, 256, 128] : [512, 256, 128];
    return powOfTwo.reduce(function (prev, curr) {
        return (Math.abs(curr - dim) < Math.abs(prev - dim) ? curr : prev);
    });
}

const getPowOfDim = (dim, format) => {
    return { x: getPowOfTwo(dim.x, format), y: getPowOfTwo(dim.y, format) }
}

const optimizeImage = (_src, _path, _dim) => {
    console.log(_src, _path, _dim);

    const resizeImage = (filename, format) => {
        let newDim = getPowOfDim(_dim, format);
        console.log(newDim);

        sharp(_path).resize({ height: newDim.x, width: newDim.y, fit: sharp.fit.fill }).toFile(`./temp/${format}/${filename}`)
    }

    return new Promise((resolve) => {
        resizeImage(_src, 'desktop');
        resizeImage(_src, 'mobile');
        resolve();
    })
}

const optimizeVideo = (_src, _path, _dim) => {
    return new Promise((resolve) => {
        let basename = PATH.parse(_src).name;
        let src = `${basename}.mp4`;
        let promises = [];

        const resizeVideo = (format) => {
            return new Promise((resolve, reject) => {
                let newDim = {
                    x: getPowOfTwo(_dim.x, format),
                    y: getPowOfTwo(_dim.y, format)
                }
                const args = [
                    '-i', _path,
                    '-vf', `scale=${newDim.x}:${newDim.y}`,
                    '-codec:a', 'libmp3lame',
                    '-c:v', 'libx264',
                    join(process.cwd(), `./temp/${format}/${src}`),
                    `-progress`, join(process.cwd(), `./progress/${basename}.txt`),
                    // `-nostats`,
                ]

                let _proc = spawn(pathToFfmpeg, args);
                _proc.stdout.on('data', function (data) {
                    console.log(data);
                });

                _proc.stderr.setEncoding("utf8")
                _proc.stderr.on('data', function (data) {
                    console.log(`err`, data);
                });

                _proc.on('close', function () {
                    console.log("DONES!");
                    resolve();
                })
            })
        }
        promises.push(resizeVideo('desktop'));
        promises.push(resizeVideo('mobile'));
        Promise.all(promises).then(values => { resolve(basename) });
    })
}


const optimizeMedia = (data) => {
    return new Promise((resolve) => {
        let type = data.type;
        let path = data.path;
        let dimensions = data.dimensions;
        let src = data.src;

        if (type === 'video') {
            optimizeVideo(src, path, dimensions)
                .then((newName) => {
                    resolve(newName);
                })
        }
        if (type === 'image') {
            optimizeImage(src, path, dimensions)
                .then((newName) => {
                    resolve(newName);
                })
        }
    })
}

// export default optimizeMedia;
module.exports = optimizeMedia;