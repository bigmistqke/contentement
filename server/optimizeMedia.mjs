
import { join } from 'path';
import { spawn } from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import sharp from 'sharp';
import path from 'path';

const delay = time => new Promise(res => setTimeout(res, time));


const getPowOfTwo = (dim, format) => {
    let powOfTwo = format === 'desktop' ? [2048, 1024, 512, 256, 128] : [512, 256, 128];
    return powOfTwo.reduce(function (prev, curr) {
        return (Math.abs(curr - dim) < Math.abs(prev - dim) ? curr : prev);
    });
}

const getPowOfDim = (dim, format) => {
    return { x: getPowOfTwo(dim.x, format), y: getPowOfTwo(dim.y, format) }
}

const optimizeImage = async (_src, _path, _dim, _format) => {
    let newDim = getPowOfDim(_dim, _format);
    await sharp(_path).resize({ width: newDim.x, height: newDim.y, fit: sharp.fit.fill }).toFile(`./temp/${_format}/${_src}`)
    return delay(500);
}

const optimizeVideo = (_src, _path, _dim, _format) => {
    let basename = path.parse(_src).name;
    let newDim = {
        x: getPowOfTwo(_dim.x, _format),
        y: getPowOfTwo(_dim.y, _format)
    }
    const args = [
        '-i', _path,
        '-vf', `scale=${newDim.x}:${newDim.y}`,
        '-codec:a', 'libmp3lame',
        '-c:v', 'libx264',
        join(process.cwd(), `./temp/${_format}/${_src}`),
        `-progress`, join(process.cwd(), `./progress/${basename}.txt`),
    ]

    let _proc = spawn(pathToFfmpeg, args);

    _proc.stderr.setEncoding("utf8")

    _proc.on('close', function () {
        console.log("DONES!");
    })
}


const optimizeMedia = (data) => {
    return new Promise((resolve) => {
        let type = data.type;
        let path = data.path;
        let dimensions = data.dimensions;
        let src = data.src;
        let format = data.format;

        if (type === 'video') {
            optimizeVideo(src, path, dimensions, format);
            resolve();
        }
        if (type === 'image') {
            optimizeImage(src, path, dimensions, format)
                .then(() => {
                    resolve();
                })
        }
    })
}
module.exports = optimizeMedia;
// export default optimizeMedia;