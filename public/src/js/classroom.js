
// Import WEB APIs
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

// Retreive the cached variableS
const class_code = localStorage["classcode"];
const privelage = localStorage["privelage"];

if (localStorage["first"] === "true") {
  overlay_on();
} else {
  overlay_off();
}

// HTML5 media contraints
const constraints = { video: true, audio: true };

// Configure Speech-to-Text via the Mozilla/W3C scritped web speech API
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';

// The global firebase database object
let db = firebase.database();

// This variable tracks the extent of the conversation
let speech_index = 0;

// The name of the student
let student_name = "";

if (privelage === "teacher") {
  student_name = "Teacher";
}

// The speech stream on the firebase realtime database
let speech_stream_ref = firebase.database().ref("classrooms/" + class_code + "/stream");

// Attach a stream listener to the database reference
speech_stream_ref.on("child_added", function(data) {
  show_captions(data);
});

function show_captions (data) {
  document.querySelector("#captions").innerText = data.val().text;
}

// Configure Speech Recognition event listeners

recognition.onresult = function(event) {

  if (event.results.length > 0) {

    let client_speech = event.results[speech_index][0].transcript;
    console.log(client_speech);
    console.log("AUDIO DETECTED");
    speech_index++;

    // Post update to the Firebase database speech stream
    let new_speech_ref = speech_stream_ref.push();
    // Append the current username and text to the new speech reference stream updater
    new_speech_ref.set({
      name: student_name,
      text: client_speech
    });

  }

}

// This method handles an successful approval; it continues setng up the rest of the stream
function handleSuccess(stream) {

  // VIDEO SETTINGS

  // The video media player stream element
  const video = document.querySelector("#camera-stream");
  const videoTracks = stream.getVideoTracks();
  window.stream = stream;
  video.srcObject = stream;

  // AUDIO SETTINGS

  // Create audio context capture device (chrome only)
  let audioContext = new AudioContext();

  // Create an audio filter node with its associated cutoff frequencies (to avoid feedback noises)
  let filterNode = audioContext.createBiquadFilter();
  filterNode.type = 'highpass';
  filterNode.frequency.value = 10000;

  // Create a gain node (to change audio volume)
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.5;

  // The audio media player stream element
  const mediaStreamSource =
    audioContext.createMediaStreamSource(stream);
    mediaStreamSource.connect(filterNode);
    filterNode.connect(gainNode);
  // Connect the gain node to the destination (i.e. play the sound)
  gainNode.connect(audioContext.destination);

  // Enable the voice speech API
  recognition.start();

}

// This method logs out any potential errors loading the media devices
function handleError(error) {
  console.log(error);
}

// This asyncronous function awaits for the user to approve the web stream element and then sets up the stream
async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    e.target.disabled = true;
  } catch (e) {
    handleError(e);
  }
}

// Enable button onclick media device initialization; e is the event the event listener proceeds the action on
document.querySelector("#present").addEventListener("click", e => init(e));

// Firebase responsive document elements
document.querySelector("#join-class").addEventListener("click", e => join_class_as_student(e));

// This function adds the student formally to the classroom
function join_class_as_student (e) {
  student_name = document.querySelector("#sname").value;
  localStorage["first"] = "false";
  console.log("JOINED");
  overlay_off();
}

// Overlay effect functions
function overlay_on() {
  document.getElementById("overlay").style.display = "block";
}

function overlay_off() {
  document.getElementById("overlay").style.display = "none";
}