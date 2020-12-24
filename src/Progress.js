import React from 'react';

const Progress = (props) => {
    return <div className="progress media" ><div style={{ width: `${250 * props.ratio}px` }}><div className="center progress__text">{props.text}</div></div></div>
}

export default Progress