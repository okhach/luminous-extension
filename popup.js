document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('captureBtn').addEventListener('click', function() {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
        chrome.tabCapture.capture({audio: true, video: false}, function(stream) {
          // Convert Data URL to Blob
          var blob = dataURLToBlob(dataUrl);

          // Send the blob to your server
          var timestamp = new Date().toISOString().replace(/[-:T.]/g, '');
          var screenshot_name = 'screenshot_' + timestamp + '.png';
          uploadToServer(blob, screenshot_name);

          // Show the image after screenshot
          var img = new Image();
          img.src = dataUrl;
          // Set image style to fit within the extension window
          img.className = 'screenshot-image';
          document.body.appendChild(img);

          // Play the welcome audio first
          playSound("welcome.mp3");

        
          startRecording(audioBlob => {
            // Generate a filename for the audio file
            var timestamp = new Date().toISOString().replace(/[-:T.]/g, '');
            var audioFileName = 'recording_' + timestamp + '.wav';
        
            // Send the audio blob to your server
            uploadAudioToServer(audioBlob, audioFileName);
          });
        });       
      });
    });
});

function playSound(audioName) {
  var audio = new Audio(audioName);
  audio.play();
}

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

function uploadToServer(blob, fileName) {
  var formData = new FormData();
  formData.append('file', blob, fileName);

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://127.0.0.1:5000/upload', true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4){
      if (xhr.status === 200){
        console.log('Screenshot Upload successful');
        // Parse the JSON response
        var response = JSON.parse(xhr.responseText);
        // Extract the blob_url
        var blobUrl = response.blob_url;
        console.log('Screenshot Blob URL:', blobUrl);
      } else {
        console.log('Screenshot Upload failed');
      }
    }
  };
  xhr.send(formData);
}

function startRecording(callback) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks = [];

      mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        callback(audioBlob); // Send the audio blob to the callback function
      });

      mediaRecorder.start();

      // Stop recording after a set time (e.g., 5 seconds)
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
    })
    .catch(err => {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        // User denied the permission
        console.error('Microphone access denied. Please allow microphone access to record audio.');
      } else {
        console.error('Recording failed:', err);
        // Handle other types of errors
      }
    });
}

function uploadAudioToServer(audioBlob, fileName) {
  var formData = new FormData();
  formData.append('file', audioBlob, fileName);

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://127.0.0.1:5000/upload/audio', true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log('Audio upload successful');
      // Handle the response here
    } else if (xhr.readyState === 4) {
      console.log('Audio upload failed');
    }
  };
  xhr.send(formData);
}
