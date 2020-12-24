import React, { useEffect, useState, useRef } from 'react';


const InfoOverlay = (props) => {
    let r_info = useRef({});
    let [text, setText] = useState();

    const updateInfo = (value, type) => {
        r_info.current[type] = value;
        props.updateInfo(props.overlayData, r_info.current);
    }

    useEffect(() => {
        let _text = props.overlayData.parent[props.overlayData.type];
        setText(_text);
        r_info.current = _text;
    }, [props])

    return <div className="overlay-container" onMouseDown={props.exit}>
        {text ? <div className="infoOverlay center" onMouseDown={(e) => { e.stopPropagation() }}>
            <header>{props.overlayData.header}</header>
            <div>big text</div>
            <textarea className="big" value={text.big} onChange={(e) => { updateInfo(e.target.value, 'big') }}></textarea>
            <div>small text</div>
            <textarea className="small" value={text.small} onChange={(e) => { updateInfo(e.target.value, 'small') }}></textarea>
        </div> : null}
    </div>
}

export default InfoOverlay