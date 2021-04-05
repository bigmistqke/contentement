import React, { useEffect, useState, useRef } from 'react';
const ProgressFooter = (props) => {
    const [progresses, setProgresses] = useState();
    let first_time = useRef();
    useEffect(() => {
        if (first_time.current) {
            first_time.current = false;
        } else {
            if (!props.projects) return;
            let _progresses = [];
            props.projects.forEach(p => p.medias.forEach(m => {
                if (!m.progress || m.progress === '') return;
                let state;
                //console.log(m.progress);
                let que = m.progress.includes('queue');
                let opt = m.progress.includes('optim');
                let des = m.progress.includes('desktop');
                let del = m.progress.includes('delet');

                if (que || del) {
                    state = 0
                    let data = { project: p.title, state: state }
                    _progresses.push(data)
                    return;
                }
                if (!que && opt && des)
                    state = 0
                if (!que && opt && !des)
                    state = 1
                if (!que && !opt && des)
                    state = 2
                if (!que && !opt && !des)
                    state = 3

                let data = { project: p.title, state: state }
                _progresses.push(data)

            }))
            setProgresses(_progresses);
        }
    }, [props.projects]);
    return progresses && progresses.length > 0 ? <div><span>queue:</span>{
        progresses.map((v, i) => {
            let state = v.state ? v.state : 0;
            return <button key={i} >{v.project}<div className='prog' style={{ transform: `scaleX(${state * 1 / 4})` }}></div></button>
        })
    }</div> : null
}


export default ProgressFooter;