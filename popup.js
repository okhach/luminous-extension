document.addEventListener('DOMContentLoaded', function () {
    var img; // Variable to hold the captured image
    document.getElementById('captureBtn').addEventListener('click', function() {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
        chrome.tabCapture.capture({audio: true, video: false}, function(stream) {

        var welcomeAudio = "welcome.mp3";

        // Show the image after screenshot
        createImg(dataUrl);

        // Show the prompt input and submit button
        document.getElementById('promptSection').style.display = 'block';

        // Play the welcome audio first
        playSound(welcomeAudio);

        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
          // Speech recognition is supported
          console.log('Speech recognition is supported.');
        } else {
          // Speech recognition is not supported
          console.error('Speech recognition is not supported.');
        }
      
        
        });
      });
    });

    document.getElementById('startRecognize').addEventListener('click', function() {
      startSpeechRecognition();
    });
    
    document.getElementById('submitBtn').addEventListener('click', function() {
      var userPrompt = document.getElementById('userPrompt').value;
  
      // Generate a timestamped filename
      var timestamp = new Date().toISOString().replace(/[-:T.]/g, '');
      var screenshot_name = 'screenshot_' + timestamp + '.png';
  
      // Send the blob and the prompt to your server
      uploadToServer(dataURLToBlob(img.src), screenshot_name, userPrompt);
    });
});

//create screenshot
function createImg(dataUrl){
  var oldImg = document.querySelector('.screenshot-image');
  if (oldImg) {
    document.body.removeChild(oldImg);
  }
  img = new Image();
  img.src = dataUrl;
  img.className = 'screenshot-image';
  document.body.appendChild(img);
  }

//play sound
function playSound(soundFile) {
  if (soundFile) {
    var audioURL = chrome.runtime.getURL(soundFile);
    var audio = new Audio(audioURL);
    audio.play()
      .then(() => console.log("Audio playback started"))
      .catch(e => console.error("Error playing audio:", e));
  }
}

// Start speech recognition
function startSpeechRecognition() {
  var recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  console.log('ready for start...');
  recognition.start();
  console.log('Start recording...');

  recognition.onresult = function(event) {
    var userPrompt = event.results[0][0].transcript;
    console.log(userPrompt);
    document.getElementById('userPrompt').value = userPrompt;
  };
}

// Convert dataUrl to Blob format
function dataURLToBlob(dataUrl) {
  var byteString = atob(dataUrl.split(',')[1]);
  var mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

function uploadToServer(blob, fileName, userPrompt) {
  var formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('prompt', userPrompt);

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://127.0.0.1:5000/upload', true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log('Upload successful');
      var response = JSON.parse(xhr.responseText);
      var audioUrl = response.audio_url;
      playAudio(audioUrl);
    }
  };
  xhr.send(formData);
}

function playAudio(audioUrl) {
  var audio = new Audio(audioUrl);
  audio.play()
    .then(() => console.log("Audio playback started"))
    .catch(e => console.error("Error playing audio:", e));
}