let lab = document.querySelector('.lab');
let inp = document.querySelector('.inp');
let back = document.querySelector('.back');
let play = document.querySelector('.play');
let next = document.querySelector('.next');
let shuffle = document.querySelector('.shuffle');
let repeat = document.querySelector('.repeat');


//======================Method to add Tracks to Playlist UI and add Event Listener to them==================
let addListElements = (fileNames, index) => {
    let ul = document.querySelector('.playlist ul');
    ul.innerHTML = '';
    for (let i = 0; i < fileNames.length; i++) {
        let li = document.createElement('li');
        let rem = document.createElement('span');
        rem.classList.add('fas');
        rem.classList.add('fa-window-close');
        console.log(fileNames[i]);
        li.innerHTML = fileNames[i];
        li.dataset.index = i;
        li.appendChild(rem);
        if(i==index) li.style.color = '#aff88d';
        rem.onclick = e =>{
            sendMessage("command", "removeThis", {index: li.dataset.index, count: 1}, handleResponse);
            e.stopPropagation();
        }
        li.onclick = () => {
            sendMessage("command", "playThis", li.dataset.index, handleResponse);
            getButtonState();
            getPlayList();
        }
        ul.appendChild(li);
    }
}
//===========================================================================================================

//=====================================Method to get UI State of all Buttons=================================
let getButtonState = () => {
    sendMessage("data-request", "buttonState", undefined, response => {
        if (response.paused) {
            play.classList.remove("fa-pause");
            play.classList.add("fa-play");
        }
        else {
            play.classList.remove("fa-play");
            play.classList.add("fa-pause");
        }
        if (response.loop) {
            repeat.style.color = "#dddddd";
        }
        else {
            repeat.style.color = "#555555";
        }
        if (response.randomize) {
            shuffle.style.color = "#dddddd";
        }
        else {
            shuffle.style.color = "#555555";
        }
    });
}
//===========================================================================================================

//=====================================Method to get UI State of the Playlist================================
let getPlayList = () => {
    sendMessage("data-request", "playlist", undefined, response => {
        addListElements(response.tracks, response.index);
    });
}
//===========================================================================================================

//======================Method to Add new Tracks to Actual Playlist==========================================
//It will take the Object URL of the files selected, push it into an array and pass that to background.js along with a addTrack command.
inp.onchange = () => {
    let tracks = []
    for (file of inp.files) {
        tracks.push({ name: file.name, url: URL.createObjectURL(file) });
    }
    inp.value = "";
    sendMessage("command", "addTracks", tracks, handleResponse);
}
//=====================================================================================================

//=====================Method to Play the next track===================================================
back.onclick = () => {
    sendMessage("command", "previousTrack", undefined, handleResponse);
    getButtonState();
}
//=====================================================================================================

//=====================Method to Play the next track===================================================
next.onclick = () => {
    sendMessage("command", "nextTrack", undefined, handleResponse);
    getButtonState();
}
//=====================================================================================================

play.onclick = () => {
    sendMessage("command", "play", undefined, handleResponse);
    getButtonState();
}

repeat.onclick = () =>{
    sendMessage("command", "repeat");
    getButtonState();
}

shuffle.onclick = () =>{
    sendMessage("command", "shuffle");
    getPlayList();
    getButtonState();
}

//=========================Will show a rich notification===============================================
//Should only be used when response was from a command type request
let handleResponse = response => {
    if (response) {
        chrome.notifications.create({
            type: 'basic',
            title: 'ExtensionTunes',
            message: response.res,
            iconUrl: 'ico.png'
        },(noti)=>{
            setTimeout(()=>chrome.notifications.clear(noti),1000);
        });
    }
}
//======================================================================================================

let handleRequests = (request, sender) => {
    //==============This variable will store the response from the message Handler.=================
    //Will be Default in case request type is not 'command'.
    let responseMessage = 'Default Response';
    //==============================================================================================

    switch (request.type) {
        //============================Handling all Commands=========================================
        //2 Switches are there. First to switch on request type, Second on request subtype.
        case 'command':
            switch (request.subtype) {
                case 'updatePlaylist':
                    getPlayList();
                    break;
                
                case 'updateButtons':
                    getButtonState();
                    break;
            }
        //=============================================================================================
    }
}


getButtonState();
getPlayList();
receiveMessage(handleRequests);