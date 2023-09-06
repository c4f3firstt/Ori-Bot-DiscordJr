let _client = AgoraRTC.createClient({mode: 'rtc', 'codec':"vp8"})

let _config = {
    appID: '51cb025ce40f4723b5a40013c1b52835',
    token: '00651cb025ce40f4723b5a40013c1b52835IACBi86N+LeBqGWIIwRpnfRqN1VOtagD7RjUjYbrsiVyg50i5AUAAAAAEAAyrb7jacOxYQEAAQBow7Fh',
    uid: null,
    channel: 'mevid'
}

let _usersNumber = 0;
let _onlineStatus = document.getElementById('online')

//Setting tracks for when user joins
let _localTracks = {
    audioTrack: null,
    videoTrack: null,
}

let _localTrackState = {
    audioTrackMuted:false,
    videoTrackMuted:false
}
//Set remote tracks to store other users
let _remoteTracks = {};
//btn interraction
document.getElementById('hide-show').addEventListener('click', () => {
    document.getElementById('footer').style.display = 'none';
    document.getElementById('lifted').style.display = 'flex';
})
document.getElementById('lift-btn').addEventListener('click', () => {
    document.getElementById('footer').style.display = 'flex';
    document.getElementById('lifted').style.display = 'none';
})

//start stream
document.getElementById('join-btn').addEventListener('click', async () => {
    // console.log("user joined");
    let _input = document.getElementById('username');
    if(_input.style.display != 'block'){
        _input.style.display = 'block';
    }
    else if(_input.value == ''){
        console.log('required')
        _input.style.borderBottomColor = '#ff6464';
        _input.style.backgroundColor = 'rgba(165, 0, 0, 0.05)'
        _input.focus();
    }else{
        let _streamPage = document.getElementById('section2');
        let _homePage = document.getElementById('section1');
        
        _homePage.style.display = 'none';
        _streamPage.style.display = 'block';
        
        joinStream();
    }
})
document.getElementById('mic-btn').addEventListener('click', async () => {
    if(!_localTrackState.audioTrackMuted){
        //Mute your audio
        await _localTracks.audioTrack.setMuted(true);
        _localTrackState.audioTrackMuted = true;
        document.getElementById('mic-btn').src ='img/assets/mic-muted.svg';
    }else{
        await _localTracks.audioTrack.setMuted(false);
        _localTrackState.audioTrackMuted = false;
        document.getElementById('mic-btn').src ='img/assets/microphone.svg';

    }
})
document.getElementById('camera-btn').addEventListener('click', async () => {
    if(!_localTrackState.videoTrackMuted){
        //Mute your audio
        await _localTracks.videoTrack.setMuted(true);
        _localTrackState.videoTrackMuted = true
        document.getElementById('camera-btn').src ='img/assets/vid-muted.svg';
    }else{
        await _localTracks.videoTrack.setMuted(false)
        _localTrackState.videoTrackMuted = false
        document.getElementById('camera-btn').src ='img/assets/video.svg';
    }
})
document.getElementById('leave-btn').addEventListener('click', async () => {
    for (trackName in _localTracks){
        let track = _localTracks[trackName]
        if(track){
            track.stop()
            track.close()
            _localTracks[trackName] = null
        }
    }

    //Leave the channel
    await _client.leave();
    document.getElementById('section2').style.display = 'none';
    document.getElementById('user-streams').innerHTML = '';
    document.getElementById('section1').style.display = 'flex'
    document.getElementById('camera-btn').src ='img/assets/video.svg';
    document.getElementById('mic-btn').src ='img/assets/microphone.svg';
})

let joinStream = async () => {
    //Is this place hear strategicly or can I add to end of method?
    
    _client.on("user-published", handleUserJoined);
    _client.on("user-left", handleUserLeft);


    _client.enableAudioVolumeIndicator(); // Triggers the "volume-indicator" callback event every two seconds.
    _client.on("volume-indicator", function(evt){
        for (let i = 0; evt.length > i; i++){
            let speaker = evt[i].uid
            let volume = evt[i].level
            if(volume > 0){
                document.getElementById(`volume-${speaker}`).src = 'img/assets/volume-on.svg';
            }else{
                document.getElementById(`volume-${speaker}`).src = 'img/assets/volume-off.svg';
            }
        }
    });

    //#6 - Set and get back tracks for local user
    [_config.uid, _localTracks.audioTrack, _localTracks.videoTrack] = await  Promise.all([
        _client.join(_config.appID, _config.channel, _config.token ||null, _config.uid ||null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()
    ])
    
    //#7 - Create player and add it to player list
    let player = `<div class="video-containers" id="video-wrapper-${_config.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${_config.uid}" src="img/assets/volume-on.svg" /> ${_config.uid}</p>
                        <div class="video-player player" id="stream-${_config.uid}"></div>
                  </div>`;

    document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
    //#8 - Player user stream in div
    _localTracks.videoTrack.play(`stream-${_config.uid}`);
    

    //#9 Add user to user list of names/ids

    //#10 - Publish my local video tracks to entire channel so everyone can see it
    await _client.publish([_localTracks.audioTrack, _localTracks.videoTrack])
   
}

let handleUserJoined = async (user, mediaType) => {
    console.log('Handle user joined');

    //#11 - Add user to list of remote users
    _remoteTracks[user.uid] = user;

    //#12 Subscribe ro remote users
    await _client.subscribe(user, mediaType);
   
    
    if (mediaType === 'video'){
        let player = document.getElementById(`video-wrapper-${user.uid}`)
        console.log('player:', player)
        if (player != null){
            player.remove()
        }
        player = `<div class="video-containers" id="video-wrapper-${user.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="img/assets/volume-on.svg" /> ${user.uid}</p>
                        <div  class="video-player player" id="stream-${user.uid}"></div>
                      </div>`
        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
         user.videoTrack.play(`stream-${user.uid}`)
    };

    if (mediaType === 'audio') {
        user.audioTrack.play();
      };
}

let handleUserLeft = (user) => {
    console.log('Handle user left!');
    //Remove from remote users and remove users video wrapper
    delete _remoteTracks[user.uid];
    document.getElementById(`video-wrapper-${user.uid}`).remove();
}

let handleUserStatus = () => {
    _onlineStatus.innerHTML = "Online : "+_usersNumber
}



