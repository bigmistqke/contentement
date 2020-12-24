
import React, { useEffect, useRef } from 'react';

const NewOverlay = (props) => {
    let r_newName = useRef();
    useEffect(() => {
        r_newName.current.focus();
    }, [])
    return <div className="overlay-container" onMouseDown={() => { props.cancel() }}>
        <div className="center newOverlay overlay" onMouseDown={(e) => { e.stopPropagation() }}>
            <input placeholder="enter title new project" ref={r_newName} ></input>
            <div className="button-container">
                <button onMouseDown={() => { props.cancel() }}>cancel</button>
                <button onMouseDown={() => {
                    if (r_newName.current.value.replace(/ /g, '').length === 0) return;
                    props.confirm(r_newName.current.value);
                }}>create</button></div>
        </div>
    </div>
}

export default NewOverlay