import { promises as fs } from 'fs';
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';

const ffmpegProgress = (src) => {
    const __dirname = dirname(fileURLToPath(import.meta.url));

    return new Promise((resolve) => {
        console.log(src);
        let basename = path.parse(src).name;
        let progress_path = `../progress/${basename}.txt`;
        progress_path = path.resolve(__dirname, progress_path);
        fs.readFile(progress_path, 'utf8').then((content) => {
            console.log('content is ', content);
            if (!content) return;
            var progresses = content.match(/progress=(.*?)\n/g);
            let progress = progresses ? progresses[progresses.length - 1].replace("progress=", "").replace("\n", "") : null;
            if (progress) { // Did it match?
                // console.log(progress);
                console.log("OLE");

                let times = content.match(/out_time_ms=(.*?)\n/g);
                let time = times ? times[times.length - 1].replace("out_time_ms=", "").replace("\n", "") : null;


                // console.log(time);
                console.log(progress, time);
                if (progress === 'end') fs.unlink(progress_path);
                resolve({ status: progress, time: time, completed: progress === 'end' ? true : false });
            } else {
                resolve({ status: 'initializing', time: 0, completed: false });
            }

        }).catch((err) => {
            resolve({ error: err, status: 'initializing' });
        })
    })



}
// export default ffmpegProgress;