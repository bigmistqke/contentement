import React, { useEffect, useRef, } from 'react';
import Media from "./Media.js";
import Progress from "./Progress.js";


const Project = (props) => {
    let r_input = useRef();
    let r_data = useRef();
    let r_project = useRef();

    useEffect(() => { console.log("EOJTIPOEJQIGTJEIQ") }, [])


    useEffect(() => {
        if (props.deleteMode) {
            r_project.current.classList.add('deleting');
        }
    }, [props.deleteMode])

    const openFileInput = () => {
        r_input.current.click();
    }

    const changeTitle = () => {
        console.log("title");
    }





    const updateData = (media_data) => {
        let _data = JSON.parse(JSON.stringify(props.data));
        let _index = _data.projects.find(p => p.title === props.title).medias.findIndex((media) => { return media_data.src === media.src });
        _data.projects.find(p => p.title === props.title).medias[_index] = media_data;
        props.setData(_data);
        r_data.current = _data;
    }

    const checkProgress = (src) => {
        /*         fetch("http://localhost:9002/resize", {
                    method: "POST",
                    body: JSON.stringify({ src: src }),
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8'
                    }
                }).then((res) => {
        
                }) */
    }

    /* let resize_data = {
const resizeMedia = async (path, media_data, dimensions, format) => {
 
        path: path,
        src: media_data.src,
        type: media_data.type,
        dimensions: dimensions,
        format: format
    }
    let resize = await fetch("http://localhost:9002/resize", {
        method: "POST",
        body: JSON.stringify(resize_data),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
} */

    /*     const uploadMedia = (media_data) => {
            let upload_data = {
                project: props.title,
                media: media_data
            }
    
            return fetch("http://localhost:9002/upload", {
                method: "POST",
                body: JSON.stringify(upload_data),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            })
        } */


    const processFiles = (e) => {
        console.log("THIS HAPPENS!!");
        console.log(e);
        [...e.target.files].forEach(file => props.mediaProcessor.queueMedia(file, props.title))
    }

    const deleteMedia = (media, index) => {
        media.progress = 'deleting media';
        updateData(media);

        let delete_data = {
            project: props.title,
            media: media
        }

        fetch("http://localhost:9002/delete", {
            method: "POST",
            body: JSON.stringify(delete_data),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        }).then(() => {
            props.deleteMedia(props.title, index);

        }).catch(() => {
            props.deleteMedia(props.title, index);
        })
    }

    const orderArray = (arr, fromIndex, toIndex) => {
        var element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
        return arr;
    }

    const orderMedia = (e, i) => {
        let dragId = e.dataTransfer.getData("id");
        let dropId = i;
        let _data = JSON.parse(JSON.stringify(props.data));
        let _medias = _data.projects.find(p => p.title === props.title).medias;

        let orderedMedias = orderArray(_medias, dragId, dropId);
        _data.projects.find(p => p.title === props.title).medias = orderedMedias;
        props.updateData(_data);
        /*         props.setData(_data);
                r_data.current = _data;
        
                saveData(); */
    }



    return <div ref={r_project} className="project">
        <header>
            <input className="title" onChange={changeTitle} value={props.title}></input>
            <button onClick={props.deleteProject}>delete project</button>
            <button onClick={props.openInfo}>info</button>
            <button onClick={openFileInput}>add media</button>
        </header>
        <div className="medias">
            {props.medias ? props.medias.map((v, i) => {
                return !v.progress ?
                    <Media
                        drop={(e) => { orderMedia(e, i) }}
                        delete={() => { deleteMedia(v, i) }}
                        medias={props.medias}
                        key={i} id={i}
                        type={v.type}
                        src={v.src}
                        project={props.title}
                        ratio={v.ratio}
                        directory={props.directory}
                    ></Media>
                    : <Progress key={i} text={v.progress} ratio={v.ratio}></Progress>
            }) : null
            }
        </div>
        <input className="hidden" type="file" multiple ref={r_input} onChange={processFiles}></input>

    </div>
}
export default Project