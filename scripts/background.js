let trackList = [];
let originalTrackList = [];
let currentTrack = new Audio();
let currentTrackIndex = 0;
let shuffle = false;
let shuffleTracker = [];
let repeat = false;

//==========================Method to Shuffle Playlist=============================================
let  shuffleTrackList = () => {
    for (let i = trackList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trackList[i], trackList[j]] = [trackList[j], trackList[i]];
    }
}
//=================================================================================================

//=============================Method to remove Track from Playlist================================
//If removed track is currently playing then it removes it and sets the Immediate next track in Playlist as the currently playing track.
let removeTracks = (index, count)=>{
    let trackName = trackList[index].name;
    let track = trackList[currentTrackIndex];
    originalTrackList.splice(originalTrackList.indexOf(trackList[index]),1);
    trackList.splice(index,1);
    if(trackList.length<1) currentTrack.src = '';
    else if(currentTrackIndex == index){
        currentTrackIndex = currentTrackIndex>=trackList.length?0:currentTrackIndex;
        let paused = currentTrack.paused;
        currentTrack.src = URL.createObjectURL(trackList[currentTrackIndex].file);
        currentTrack.load();
        if(!paused) currentTrack.play();
    }
    else currentTrackIndex = trackList.indexOf(track);
    sendMessage("command", "updatePlaylist");
    sendMessage("command", "updateButtons");
    return `Removed ${trackName} from Playlist!`;
}
//=================================================================================================

let addTracks = addList => {
    //==============Adding Tracks to the Current Playlist===========================================
    for (elem of addList) {
        const track = elem;
        let empty = !trackList.length;
        fetch(track.url).then(res => res.blob()).then(res => {
            let trackData = {
                name: track.name,
                file: new File([res], track.name)
            }
            trackList.push(trackData);
            originalTrackList.push(trackData);
            if(empty) currentTrack.src = URL.createObjectURL(trackList[currentTrackIndex].file);
            sendMessage("command", "updatePlaylist");
        });
    }
    return `Added ${addList.length} new Tracks`;
    //==============================================================================================
}

let changeTrack = (changeType, trackIndex, index = changeType == "Next" ? currentTrackIndex+1 : changeType == "Back" ? currentTrackIndex-1 : changeType == "playThis" ? parseInt(trackIndex) : currentTrackIndex) => {

    //==============Figuring out the Track to play based on all flags================================
    //Variable Index will hold the calculated Record Index or -1 if Playlist has Ended.
    //If repeat is off then Index will be -1 for last or first Track depending on the request subtype.
    if (trackList.length < 1) return 'Add Tracks to Playlist first';
    if (repeat)
        index = index >= trackList.length ? 0 : index < 0 ? trackList.length - 1 : index;
    else {
        index = index >= trackList.length || index < 0 ? -1 : index;
    }
    if (index == -1) {
        return 'Playlist Ended. Turn Repeat on or select a track to restart Playlist';
    }
    //==============================================================================================
    //================Playing the Next Track========================================================
    currentTrackIndex = index;
    currentTrack.src = URL.createObjectURL(trackList[currentTrackIndex].file);
    currentTrack.load();
    currentTrack.play();
    sendMessage("command", "updatePlaylist");
    return `Now Playing ${trackList[currentTrackIndex].name}`;
    //==============================================================================================
}

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

                case 'addTracks':
                    responseMessage = addTracks(request.content);
                    return { res: responseMessage };

                case 'nextTrack':
                    responseMessage = changeTrack('Next');
                    return { res: responseMessage };

                case 'previousTrack':
                    responseMessage = changeTrack('Back');
                    return { res: responseMessage };

                case 'playThis':
                    responseMessage = changeTrack('playThis', request.content);
                    return { res: responseMessage };

                case 'play':
                    console.log(currentTrackIndex);
                    if(trackList.length < 1) return {res: 'Add Tracks to Playlist first'};
                    if ((currentTrackIndex >= trackList.length || currentTrackIndex < 0) && currentTrack.paused) {
                        currentTrackIndex = 0;
                        currentTrack.src = URL.createObjectURL(trackList[currentTrackIndex].file);
                        currentTrack.play();
                        return { res: `Now Playing ${trackList[currentTrackIndex].name}` };
                    }
                    if (currentTrack.paused) {
                        currentTrack.play();
                    }
                    else currentTrack.pause();
                    break;
                
                case 'repeat':
                    repeat = !repeat;
                    break;
                
                case 'shuffle':
                    if(shuffle){
                        currentTrackIndex = originalTrackList.indexOf(trackList[currentTrackIndex]);
                        trackList=[];
                        trackList.push(...originalTrackList);
                    }
                    else{
                        shuffleTrackList();
                        currentTrackIndex = trackList.indexOf(originalTrackList[currentTrackIndex]);
                    }
                    sendMessage("command", "updatePlaylist");
                    shuffle = !shuffle;
                    break;

                case 'removeThis':
                    responseMessage = removeTracks(request.content.index, request.content.count);
                    return {res: responseMessage};
            }
            break;

        case 'data-request':
            switch (request.subtype) {

                case 'buttonState':
                    return {
                        paused: currentTrack.paused,
                        loop: repeat,
                        randomize: shuffle
                    };

                case 'playlist':
                    return {
                        tracks: trackList.map(track => track.name),
                        index: currentTrackIndex
                    };
            }
    }
        //===========================================================================================
}

//======================================Changing Tracks on Current Track End=========================
currentTrack.onended = ()=>{
    let message = changeTrack("Next");
    chrome.notifications.create({
        type: 'basic',
        title: 'ExtensionTunes',
        message: message,
        iconUrl: 'ico.png'
    },(noti)=>{
        setTimeout(()=>chrome.notifications.clear(noti),1000);
    });
}
//=====================================================================================================

receiveMessage(handleRequests);

