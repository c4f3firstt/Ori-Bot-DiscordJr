/////////////////////////////////////////
//    MEVID CHATROOM By Yasin Vandry   //
/////////////////////////////////////////

//#1
let client = AgoraRTC.createClient({mode:'rtc', codec:"vp8"})

//#2
let config = {
    appid:'6a6ddc270df04808a3a511640b86b773', //Enter the appID you created from your Agora account
    token:'0066a6ddc270df04808a3a511640b86b773IAAp5TEAM4poqnE+CphSzP7bEikru8DWeImdJsAEOxaSmfekyakAAAAAEABB0Z93S5zeYQEAAQBKnN5h', //The token from Agora account
    uid:null, // leave this null for now b'cause it will create new uid once you join the chat
    channel:'mevid00', //Enter the channel name from the agora project you created
}

//#3 - Setting tracks for when user joins
let localTracks = {
    audioTrack:null,
    videoTrack:null
}

//#4 - Want to hold state for users audio and video so user can mute and hide
let localTrackState = {
    audioTrackMuted:false,
    videoTrackMuted:false
}

//#5 - Set remote tracks to store other users
let remoteTracks = {}

let messeges = {
    userMsg:null,
    input:null
}

var input = document.getElementById('user-name');

input.addEventListener('keyup', function(e){
    if(e.keyCode === 13){
        joinRoom();
    }
})
var getBrowserWidth = function(){
    if(window.innerWidth < 800){
        document.getElementById('cross-plus-page').style.display = 'flex'
        document.getElementById('login-page').style.display = 'none'
    } else {
        document.getElementById('login-page').style.display = 'flex'; // Original value 'flex'
        document.getElementById('cross-plus-page').style.display = 'none' // Original value 'none'
    }
};
getBrowserWidth();
//copy link
let copyBtn = document.getElementById('copy-link');
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    let linkBox = document.getElementById('link-copied-msg');
    linkBox.style.display = 'flex';
    linkBox.innerHTML = 'Link Copied Succcessfull';
    hide(linkBox);
})
document.getElementById('join-btn').addEventListener('click', async () => {
    joinRoom();
})
let joinRoom = () => {
    let _input = document.getElementById('user-name');

    if(_input.value == ''){
        _input.style.borderColor = '#ff6464';
        _input.style.backgroundColor = 'rgba(165, 0, 0, 0.05)'
        _input.focus();
    }else if(document.querySelector('#check-box').checked === false){
        document.getElementById('check-box-bg').style.borderBottomStyle = 'solid';

        document.querySelector('#check-box').addEventListener('click', () => {
            if(document.querySelector('#check-box').checked != false){
                document.getElementById('check-box-bg').style.borderBottomStyle = 'none';
            }else{
                document.getElementById('check-box-bg').style.borderBottomStyle = 'solid';
            }
        })
    }
    else{
        document.getElementById('check-box-bg').style.borderBottomStyle = 'none';
        let _chatRoom = document.getElementById('chat-room');
        let _loginPage = document.getElementById('login-page');
        
        _loginPage.style.display = 'none';
        _chatRoom.style.display = 'flex';
        
        config.uid = document.getElementById('user-name').value
        joinStreams();

        //display cover
        let userName = config.uid;
        let name = userName.substring(0, 2)
        let cover = `<div class="user-ico-cover" id="user-ico-cover">
                        <div class="circle-1">
                            <div class="circle-2">
                                <span class="user-prof-name">${name}</span>
                            </div>
                        </div>
                    </div>`;
        document.getElementById(`video-wrapper`).insertAdjacentHTML('beforeend', cover);
    }
}
document.getElementById('mic-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.audioTrackMuted){
        //Mute your audio
        await localTracks.audioTrack.setMuted(true);
        localTrackState.audioTrackMuted = true;
        document.getElementById('mic-icon').src = 'img/assets/mic-muted.svg'
    }else{
        await localTracks.audioTrack.setMuted(false);
        localTrackState.audioTrackMuted = false;
        document.getElementById('mic-icon').src = 'img/assets/mic.svg'
    }
})
document.getElementById('cam-btn').addEventListener('click', async () => {
    //Disable button
    if(!localTrackState.videoTrackMuted){
        //Mute your audio
        await localTracks.videoTrack.setMuted(true);
        localTrackState.videoTrackMuted = true;
        document.getElementById('cam-icon').src = 'img/assets/cam-muted.svg'
        document.getElementById('user-ico-cover').style.zIndex = '999'
    }else{
        await localTracks.videoTrack.setMuted(false)
        localTrackState.videoTrackMuted = false;
        document.getElementById('cam-icon').src = 'img/assets/cam.svg'
        document.getElementById('user-ico-cover').style.zIndex = '0'
    }
})
document.getElementById('leave-btn').addEventListener('click', async () => {
    let dialog = document.getElementById('dialog');
    dialog.style.display = 'flex';
    document.querySelector('.dialog-text').innerHTML = 'Are you sure you want to leave the room?'
    
    let stayBtn = document.getElementById('stay');
    let leaveBtn = document.getElementById('leave');

    stayBtn.addEventListener('click', () => {
        dialog.style.display = 'none';
    })
    leaveBtn.addEventListener('click', async () => {
        for (trackName in localTracks){
            let track = localTracks[trackName]
            if(track){
                track.stop()
                track.close()
                localTracks[trackName] = null
            }
        }
        //Leave the channel
        await client.leave()
        onLeaveSound();
        dialog.style.display = 'none';
        document.getElementById('chat-room').style.display = 'none';
        document.getElementById('login-page').style.display = 'flex'
    })
})
//Method will take all my info and set user stream in frame
let joinStreams = async () => {
    onJoinSound();
    //Is this place hear strategicly or can I add to end of method?
    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);
    client.enableAudioVolumeIndicator(); // Triggers the "volume-indicator" callback event every two seconds.
    client.on("volume-indicator", function(evt){
        for (let i = 0; evt.length > i; i++){
            let speaker = evt[i].uid
            let volume = evt[i].level
            if(volume > 0){
                document.getElementById(`volume-${speaker}`).src = 'img/assets/volume-on.svg'
            }else{
                document.getElementById(`volume-${speaker}`).src = 'img/assets/volume-off.svg'
            }
        }
    });
    // #6 - Set and get back tracks for local user
    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await  Promise.all([
        client.join(config.appid, config.channel, config.token ||null, config.uid ||null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()

    ])
    //#7 - Create player and add it to player list
    let player = `<div class="user-stream" id="video-wrapper-${config.uid}">
                    <p class="user-uid">
                    <img class="volume-icon" id="volume-${config.uid}" src="img/assets/volume-on.svg" />
                        ${config.uid}
                    </p>
                    <div class="video-player player" id="stream-${config.uid}"></div>
                </div>`
    document.getElementById('video-wrapper').insertAdjacentHTML('beforeend', player);
    //#8 - Player user stream in div
    localTracks.videoTrack.play(`stream-${config.uid}`)

    //#10 - Publish my local video tracks to entire channel so everyone can see it
    await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
    checkRoomMates();
}

let handleUserJoined = async (user, mediaType) => {
    //#11 - Add user to list of remote users
    remoteTracks[user.uid] = user
    //#12 Subscribe ro remote users
    await client.subscribe(user, mediaType)
    showMessege(user, 'joined room');
    loadRoomMates();
    //stream contents from users
    if (mediaType === 'video'){
        let player = document.getElementById(`video-wrapper-${user.uid}`);
        console.log('player:', player)
        if (player != null){
            player.remove()
        }
        let userName = user.uid;
        let name = userName.substring(0, 2)
        player = `<div class="new-user" id="video-wrapper-${user.uid}">
                        <div class="users-ico-cover">
                            <div class="circle-1">
                                <div class="circle-2">
                                    <span class="user-prof-name">${name}</span>
                                </div>
                            </div>
                        </div>
                         <p class="users-uid">
                         <img class="volume-icon" id="volume-${user.uid}" src="img/assets/volume-on.svg" />
                             ${user.uid}
                         </p>
                        <div class="video-player player" id="stream-${user.uid}"></div>
                </div>`
        document.getElementById('users-video-wrapper').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`stream-${user.uid}`)
    }
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
    checkRoomMates();
}
let handleUserLeft = (user) => {
    //Remove from remote users and remove users video wrapper
    delete remoteTracks[user.uid]
    document.getElementById(`video-wrapper-${user.uid}`).remove();
    checkRoomMates();
    onLeft();
    showMessege(user, "left room")
}
//check elements
let checkRoomMates = async () => {
    //#12 Subscribe ro remote users
    let set = document.getElementById('users-video-wrapper');
    let elements = set.getElementsByClassName('new-user').length;
    if(elements === 0){
        document.getElementById('room-cover').style.display = 'flex';
    }else{
        if(elements === 1){
        document.querySelector('.new-user').style.width = '100%';
        document.querySelector('.new-user').style.height = '80%';
    }else{
        document.querySelector('.new-user').style.width = '48%';
        document.querySelector('.new-user').style.height = '48%';
    }
    }
}
// onUser-left
async function showMessege(user, msg){
    let msgPopUp = document.getElementById('user-join-msg');
    let userName = user.uid, uMsg = msg;
    if((msgPopUp).style.display != 'flex'){
        msgPopUp.style.display = 'flex';
        msgPopUp.innerHTML = userName + ' ' + uMsg;
        onJoinSound();
        hide(msgPopUp);   
    }else{
        msgPopUp.innerHTML = userName + ' ' + uMsg;
        onJoinSound();
        hide(msgPopUp);   
    }
}
//refresh
function sleep(time){
    return new Promise((resolve)=>setTimeout(resolve,time)
  )
}
async function reload(){
    await sleep(1000);
    location.reload();
}
//Sound Fx
let onJoinSound = () => {
    let sound = new Audio('sfx/on-join.mp3');
    sound.play();
}
let onLeaveSound = () => {
    let sound = new Audio('sfx/quit-fx.mp3');
    sound.play();
    reload()
}
let onMuteSound = () => {
    let sound = new Audio('sfx/mute-un-fx.mp3');
    sound.play();
}
let onLeft = () => {
    let sound = new Audio('sfx/on-leave.mp3');
    sound.play();
}
//simple animation
async function hide(element){
    await sleep(3500);
    element.style.display = 'none';
}
let responsiveDetection = async (user) => {
    //responsive detection
    let set = document.getElementById('user-wrapper');
    let setElements = set.getElementsByClassName('new-user').length;

    if(setElements === 1){
        alert('less than 2')
        document.getElementById(`video-wrapper-${user.uid}`).style.width = '100%';
        document.getElementById(`video-wrapper-${user.uid}`).style.height = '100%'
    }
    
    document.getElementById(`video-wrapper-${user.uid}`).style.width = '49%';
    document.getElementById(`video-wrapper-${user.uid}`).style.height = '49%'
}
let loadRoomMates = () => {
    document.getElementById('room-cover').style.display = 'none';
}
