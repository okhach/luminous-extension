document.addEventListener('DOMContentLoaded', function () {
    var img; // Variable to hold the captured image
    document.getElementById('captureBtn').addEventListener('click', function() {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
        // Convert Data URL to Blob
        var blob = dataURLToBlob(dataUrl);

        // Show the image after screenshot
        img = new Image();
        img.src = dataUrl;
        // Set image style to fit within the extension window
        img.className = 'screenshot-image';
        document.body.appendChild(img);

        // Show the prompt input and submit button
        document.getElementById('promptSection').style.display = 'block';
      });
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