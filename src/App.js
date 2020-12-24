import React, { useEffect, useState, useRef } from 'react';
import Project from "./Project.js"
import InfoOverlay from "./InfoOverlay.js"
import NewOverlay from "./NewOverlay.js"
import DeleteOverlay from "./DeleteOverlay.js"
import MediaProcessor from "./MediaProcessor.js";
import ProgressFooter from "./ProgressFooter.js";


import "./stylesheet.css"

function App() {
  const [data, setData] = useState();
  const [infoOverlay, setInfoOverlay] = useState(false);
  const [newOverlay, setNewOverlay] = useState(false);
  const [deleteOverlay, setDeleteOverlay] = useState(false);

  const r_data = useRef();
  const r_newName = useRef();
  let r_mediaProcessor = useRef();

  const cleanData = (data) => {
    let _data = JSON.parse(JSON.stringify(data));
    let _projects = _data.projects;
    _projects.forEach(_project => {
      _project.medias = _project.medias.filter(m => !m.progress);
    })
    return _data;
  }

  useEffect(() => {
    r_mediaProcessor.current = new MediaProcessor(updateMedia, saveData);

    fetch("http://localhost:9002/fetch")
      .then(res => { return res.json() })
      .then(res => {
        //console.log.log(res);
        let clean = cleanData(res);
        r_data.current = clean;
        setData(clean);
      });
  }, []);

  const cleanData1 = (_data) => {
    let cleanedData = {};
    cleanedData.about = _data.about;
    cleanedData.contact = _data.contact;
    cleanedData.projects = [];

    let _projects = _data.projects;
    let cleanedProjects = [];
    Object.entries(_projects).forEach(([_project_name, _project]) => {
      let cleanedProject = {};

      cleanedProject.title = _project_name;
      cleanedProject.info = _project.info;

      cleanedProject.directory = encodeURI(_project_name);
      cleanedProject.medias = [];

      //console.log.log(cleanedProject);

      _project.children.forEach((_media, i) => {
        let cleanedMedia = {};
        cleanedMedia.src = _media.src;
        cleanedMedia.type = _media.type;
        cleanedMedia.ratio = _media.scale.x / _media.scale.y;
        cleanedProject.medias.push(cleanedMedia);
      })
      cleanedProjects.push(cleanedProject);
      /*       _data.projects[project_name].medias = project.medias.filter(e => !!e);
            _data.projects[project_name].medias.forEach((media) => {
              media.encodedSrc = encodeURI(media.src);
            })
      
            cleanedProjects.push({
              title: project_name,
              directory: encodeURIComponent(project_name),
              info: project.info,
              medias: project.medias
            }) */
    })
    _data.projects = cleanedProjects;
    return _data;
  }



  const openInfo = (parent, type, project_title) => {
    setInfoOverlay({
      type: type,
      parent: parent,
      project: project_title ? project_title : null,
      header: project_title ? `info of ${project_title}` : `general ${type}`
    });
  }

  const updateInfo = (_overlay, info) => {
    let _data = JSON.parse(JSON.stringify(data));
    if (_overlay.project) {
      _data.projects.find(p => p.title === _overlay.project)[_overlay.type] = info;
    } else {
      _data[_overlay.type] = info;
    }
    updateData(_data, false);
  }



  const saveData = () => {
    return fetch("http://localhost:9002/save", {
      method: "POST",
      body: JSON.stringify(r_data.current),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    })
  }

  const initNewProject = () => {
    setNewOverlay(true);
  }

  const addProject = (newName) => {
    let _data = JSON.parse(JSON.stringify(data));
    _data.projects.push({
      title: newName,
      directory: encodeURIComponent(newName),
      info: { big: '', small: '' },
      medias: []
    })
    setNewOverlay(false);
    updateData(_data, false);
    fetch("http://localhost:9002/addProject", {
      method: "POST",
      body: JSON.stringify({ project: newName }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    }).then(() => {
      saveData();
    })
  }


  const deleteProject = (project) => {
    let project_name = project.title;
    setDeleteOverlay(false);
    let _data = JSON.parse(JSON.stringify(data));
    _data.projects.find(p => p.title === project_name).deleteMode = true;
    updateData(_data);

    fetch("http://localhost:9002/deleteProject", {
      method: "POST",
      body: JSON.stringify({ project: project_name }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    }).then((res) => {
      let _data = JSON.parse(JSON.stringify(data));
      _data.projects = _data.projects.filter(p => p.title !== project_name);
      updateData(_data);
    })
  }

  const updateData = (_data, save = true) => {
    setData(_data);
    r_data.current = _data;
    if (save) saveData();
  }

  const deleteMedia = (project_name, mIndex) => {
    let _data = JSON.parse(JSON.stringify(r_data.current));
    let pIndex = _data.projects.findIndex(p => p.title === project_name);
    console.log(pIndex, mIndex);
    _data.projects[pIndex].medias.splice(mIndex, 1);
    console.log(_data);
    updateData(_data);
  }

  const updateMedia = (media, project_name) => {
    let _data = JSON.parse(JSON.stringify(r_data.current));
    let pIndex = _data.projects.findIndex(p => p.title === project_name);
    let mIndex = _data.projects[pIndex].medias.findIndex(m => { return media.src === m.src });

    if (mIndex !== -1) {
      _data.projects[pIndex].medias[mIndex] = media;
    } else {
      _data.projects[pIndex].medias.push(media);
    }

    updateData(_data, false);
  }

  return (
    <div className="App flex">
      {infoOverlay ? <InfoOverlay updateInfo={updateInfo} exit={() => { setInfoOverlay(false); saveData(); }} overlayData={infoOverlay}></InfoOverlay> : null}
      {newOverlay ? <NewOverlay confirm={addProject} cancel={() => { setNewOverlay(false) }}></NewOverlay> : null}
      {deleteOverlay ? <DeleteOverlay project={deleteOverlay} cancel={() => { setDeleteOverlay(false) }} confirm={() => { deleteProject(deleteOverlay) }}></DeleteOverlay> : null}


      <header>
        <div className="title grey">Post Neon</div>
        <button onClick={() => { openInfo(data, 'contact') }}>contact</button>
        <button onClick={() => { openInfo(data, 'about') }}>about</button>
        <button onClick={initNewProject}>add project</button>
      </header>
      <div className="scroll flexing">
        {

          data ? data.projects.map((v, i) => {
            return <Project
              mediaProcessor={r_mediaProcessor.current}
              deleteMode={v.deleteMode}
              deleteProject={() => { setDeleteOverlay(v) }}
              deleteMedia={deleteMedia}
              data={data}
              openInfo={() => { openInfo(v, 'info', v.title) }}
              setData={setData}
              updateData={updateData}
              key={i}
              title={v.title}
              medias={v.medias}
              directory={v.directory}
            ></Project>
          }) : null
        }
      </div>
      <footer>
        {data && data.projects ? <ProgressFooter projects={data.projects}></ProgressFooter> : null}
      </footer>
    </div >
  );
}

export default App;
