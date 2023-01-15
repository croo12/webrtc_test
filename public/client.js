// import {io} from "socket.io"

const rsc = document.getElementById('rsc');
const rinput = document.getElementById('rinput');
const cbtn = document.getElementById('cbtn');

const vcc = document.getElementById('vcc');
const lvdo = document.getElementById('lvdo');
const rvdo = document.getElementById('rvdo');

// console.log(rsc, rinput, cbtn, vcc, lvdo, rvdo);

const socket = io();
const constraints = {
    audio: true,
    video: {width: 600, height: 480}
}

let lst
let rst
let isRoomCreator
let rtcPeerConnection
let roomId

const iceServers = {
    iceServers: [
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun1.l.google.com:19302'},
        {urls: 'stun:stun2.l.google.com:19302'},
        {urls: 'stun:stun3.l.google.com:19302'},
        {urls: 'stun:stun4.l.google.com:19302'}
    ]
}

//버튼에 이벤트 리스너 등록
cbtn.addEventListener('click', () => {
    console.log(`click event activate`);
    joinRoom(rinput.value);
})

socket.on('room_created', async () => {
    console.log(`socket event callback : room_created`);

    await setLocalStream(constraints);
    isRoomCreator = true;
})

socket.on('room_joined', async () => {
    console.log(`socket event callback : room_joined`);

    await setLocalStream(constraints);
    socket.emit('start_call', roomId);
})

socket.on('full_room', () => {
    console.log(`room is full`);

    alert(`room is full`)
})

//funcs

const joinRoom = (room) => {
    if( room === ''){
        alert('방 이름을 입력해주세요')
    }else{
        roomId = room;
        socket.emit('join', room);
        showVideoConference();
    }
}

const showVideoConference = () => {
    rsc.style = 'display : none';
    vcc.style = 'display : block';
}

const setLocalStream = async () => {
    console.log(`local stream setting ... `);
    let stream;

    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
    }catch (err) {
        console.log( `유저미디어에 접근 실패`, err);
    }

    lst = stream;
    lvdo.srcObject = stream;
}

// socket event callbacks

socket.on('start_call', async () => {
    console.log(`socket event callback : start_call`);

    if(isRoomCreator){
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        addLocalTracks(rtcPeerConnection);
        rtcPeerConnection.ontrack = setRemoteStream;
        rtcPeerConnection.onicecandidate = sendIceCandidate
        await createOffer(rtcPeerConnection)
    }
})

socket.on('webrtc_offer', async (event) => {
    if(!isRoomCreator){
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        addLocalTracks(rtcPeerConnection);
        rtcPeerConnection.ontrack = setRemoteStream;
        rtcPeerConnection.onicecandidate = sendIceCandidate
        rtcPeerConnection.setRemoteDescription(
            new RTCSessionDescription(event)
        )
        await createAnswer(rtcPeerConnection)
    }
})

socket.on('webrtc_answer', (event) => {    
        rtcPeerConnection.setRemoteDescription(
            new RTCSessionDescription(event)
        )
})

socket.on('webrtc_ice_candidate', (event) => {
    console.log(`socket event callback : webrtc_ice_candidate`, event);

    let candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    })
    rtcPeerConnection.addIceCandidate(candidate);
})

//funcs

const addLocalTracks = (rtcPeerConnection) => {
    console.log( `add Local Tracks `);
    console.log(lst.getTracks());

    lst.getTracks().forEach(element => {
        rtcPeerConnection.addTrack(element, lst);
    });
}

const createOffer = async(rtcPeerConnection) => {
    let sessionDescription;
    try {
        sessionDescription = await rtcPeerConnection.createOffer();
        rtcPeerConnection.setLocalDescription(sessionDescription)
    }catch ( err ){
        console.log(err);
    }

    socket.emit('webrtc_offer', {
        type: 'webrtc_offer',
        sdp: sessionDescription,
        roomId
    })
}

const createAnswer = async (rtcPeerConnection) => {
    let sessionDescription;
    try{
        sessionDescription = await rtcPeerConnection.createAnswer();
        rtcPeerConnection.setLocalDescription(sessionDescription);
    }catch ( err ){
        console.log(err);
    }

    socket.emit('webrtc_answer', {
        type: 'webrtc_answer',
        sdp: sessionDescription,
        roomId
    })
}

const setRemoteStream = (event) => {
    rvdo.srcObject = event.streams[0];
    rst = event.stream;
}

const sendIceCandidate = (event) => {
    if(event.candidate) {
        socket.emit('webrtc_ice_candidate', {
            roomId,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate
        })
    }
}