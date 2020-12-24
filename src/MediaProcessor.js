import uniqid from 'uniqid';


export default class MediaProcessor {

    getDimensions = (file, type) => {
        console.log(file);
        return new Promise((resolve) => {
            switch (type) {
                case 'video':
                    let video = document.createElement("video");
                    video.src = `safe://${file.path}`;
                    video.addEventListener("loadedmetadata", function (e) {
                        console.log({ x: this.videoWidth, y: this.videoHeight });
                        resolve({ x: this.videoWidth, y: this.videoHeight });
                    }, false);
                    break;
                case 'image':
                    let img = document.createElement("img");
                    // img.src = file.pathv;
                    // img.src = file.path.replace('file:///', 'media:///');
                    img.src = `safe://${file.path}`;
                    img.addEventListener("load", function (e) {
                        resolve({ x: this.width, y: this.height });
                    }, false);
                    break;
                default:
                    resolve(false);
                    break;
            }
        })
    }

    getType = (file) => {
        return file.type.split("/")[0];
    }

    pingProgress = (media, format, duration, resolve) => {
        console.log("FEEEEEEEEETCH");
        //console.log("PING!", media, format, resolve);
        fetch("http://localhost:9002/progressResize", {
            method: "POST",
            body: JSON.stringify(media),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        }).then(res => {
            return res.json();
        }).then(progress => {
            //console.log(progress);
            let percentage = progress.time / duration;
            percentage = Math.round(percentage * 100) / 100;
            let p_text = `optimizing ${format}: ${percentage} %`;
            this.updateProgress(media, p_text);

            if (progress.status === 'end') {
                //console.log("END!");
                resolve();
            } else {
                setTimeout(() => {
                    this.pingProgress(media, format, duration, resolve);
                }, 250);
            }
        }).catch(() => {
            setTimeout(() => {
                this.pingProgress(media, format, duration, resolve);
            }, 250);
        })
    }

    getDuration = (path) => {
        return new Promise((resolve) => {
            let video = document.createElement('video');
            video.addEventListener('loadedmetadata', () => {
                resolve(video.duration * 10000);
            })
            video.src = `safe:///${path}`;
        })

    }





    progressResize = (media, format) => {
        const pingResize = (media, format, duration, resolve) => {
            console.log("PING!", media, format, resolve);
            fetch("http://localhost:9002/progressResize", {
                method: "POST",
                body: JSON.stringify(media),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            }).then(res => {
                return res.json();
            }).then(progress => {
                //console.log(progress);
                let percentage = progress.time / duration;
                percentage = Math.round(percentage * 100) / 100;
                percentage = percentage ? percentage : 0;
                let p_text = `optimizing ${format}: ${percentage} %`;
                this.updateProgress(media, p_text);

                if (progress.status === 'end') {
                    //console.log("END!");
                    resolve();
                } else {
                    setTimeout(() => {
                        pingResize(media, format, duration, resolve);
                    }, 1000);
                }
            })
        }
        return new Promise((resolve) => {
            this.getDuration(media.path).then(duration => {
                console.log('RESIZE!!', media, format, duration);
                setTimeout(() => {
                    pingResize(media, format, duration, resolve);
                }, 1000);
            })
        })
    }

    resizeMedia = (media, format) => {
        return new Promise((resolve) => {
            //console.log('resize', media, format);
            let resize_data = {
                path: media.path,
                src: media.src,
                type: media.type,
                dimensions: media.dimensions,
                format: format,
            }
            this.updateProgress(media, `optimizing for ${format}`);
            fetch("http://localhost:9002/resize", {
                method: "POST",
                body: JSON.stringify(resize_data),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            }).then((res) => {
                resolve(res);
            })
            /*             if (media.type === 'video') {
                            resolve();
                        } */
        })
    }


    progressUpload = (media) => {
        let pingUpload = (media, resolve) => {
            fetch("http://localhost:9002/progressUpload", {
                method: "POST",
                body: JSON.stringify(media),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            }).then(res => {
                return res.json();
            }).then(progress => {
                //console.log(progress);
                let format = progress.format ? progress.format : 'desktop';
                let percent = progress.percent ? progress.percent : 0;
                let p_text = `uploading ${format}: ${percent} %`;
                this.updateProgress(media, p_text);
                if (progress.status === 'end' && progress.format === 'mobile') {
                    console.log("END!");
                    resolve();
                } else {
                    setTimeout(() => {
                        pingUpload(media, resolve);
                    }, 1000);
                }
            })
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                pingUpload(media, resolve);

            }, 2000);
        })
    }


    uploadMedia = (media) => {
        return new Promise(
            (resolve) => {
                this.updateProgress(media, "uploading to server");
                console.log(media.type);
                if (media.type === 'video') {
                    this.progressUpload(media).then(() => {
                        this.updateProgress(media, false);
                    })
                }
                console.log('this happens?');
                fetch("http://localhost:9002/upload", {
                    method: "POST",
                    body: JSON.stringify(media),
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8'
                    }
                }).then(res => {
                    return res.json()
                }).then(res => {
                    console.log("UPLOADING DOENSIES!");
                    resolve(res);
                }).catch(err => {

                    console.log(err);
                    resolve(err)
                })
            }
        )
    }

    updateProgress = (media, p_text) => {
        //console.log(media, p_text);
        let project = media.project;
        console.log("UPDATE PROGRESS", media, p_text);
        if (p_text) {
            media.progress = p_text;
        } else {
            media = {
                src: media.src,
                ratio: media.ratio,
                type: media.type,
            }
        }
        this.updateData(media, project);
    }



    processQueue = async () => {
        this.processing = true;
        let media = this.queue[0];
        await this.resizeMedia(media, 'desktop');
        console.log("PROCESS", media);
        if (media.type === 'video') await this.progressResize(media, 'desktop');
        await this.resizeMedia(media, 'mobile');
        if (media.type === 'video') await this.progressResize(media, 'mobile');
        let uploaded = await this.uploadMedia(media);
        console.log("UPLAODED IS", uploaded);
        if (uploaded.sucess)
            this.updateProgress(media, false)
        else {
            console.log("ERRRRRRRRR", uploaded.error);
            this.updateProgress(media, `error while uploading: ${JSON.stringify(uploaded.error)}`)

        }
        this.queue.shift();
        this.saveData();
        this.queue.length === 0 ? this.processing = false : this.processQueue();
    }

    queueMedia = async (file, project_name) => {
        let type = this.getType(file);
        let dimensions = await this.getDimensions(file, type);
        let media = {
            path: file.path.replace('file', 'safe'),
            src: type === 'image' ? `${uniqid()}.png` : `${uniqid()}.mp4`,
            type: type,
            dimensions: dimensions,
            ratio: dimensions.x / dimensions.y,
            project: project_name,
        }
        this.updateProgress(media, 'media added to queue');
        this.queue.push(media);
        if (!this.processing) this.processQueue();
        return media;
    }

    constructor(updateData, saveData) {
        this.queue = [];
        this.updateData = updateData;
        this.saveData = saveData;
        this.processing = false;

    }
}