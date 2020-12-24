
import React, { useEffect } from 'react';

const DeleteOverlay = (props) => {
    useEffect(() => {
        console.log(props);
    }, [props])
    return <div className="overlay-container" onMouseDown={props.cancel}>
        <div className="center newOverlay overlay" onMouseDown={(e) => { e.stopPropagation() }}>
            <header>Are you sure you want to delete {props.project.title}?</header>
            <div className="button-container">
                <button onMouseDown={props.cancel}>cancel</button>
                <button onMouseDown={props.confirm}>confirm</button>
            </div>
        </div>
    </div>
}

export default DeleteOverlay