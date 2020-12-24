const Overlay = (props) => {
    return <div class="overlay-container" onClick={props.saveData}>
        <div id="overlay center">
            <div>big text</div>
            <textarea class="big" value={props.data.big}></textarea>
            <div>small text</div>
            <textarea class="small" value={props.data.big}></textarea>
        </div>
    </div>
}

export default Overlay