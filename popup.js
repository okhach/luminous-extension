document.addEventListener("DOMContentLoaded", function () {
  var img; // Variable to hold the captured image
  document.getElementById("captureBtn").addEventListener("click", function () {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
      // Convert Data URL to Blob
      var blob = dataURLToBlob(dataUrl);

      // Show the image after screenshot
      createImg(dataUrl);

      // Show the prompt input and submit button
      document.getElementById("promptSection").style.display = "block";
    });

    // Play the start recording sound
    var welcomeAudio = 'https://msaiclassroom.blob.core.windows.net/beep-audio/tell-me-your-question.mp3';
    // var audio = playSound(welcomeAudio);

    // Start the speech recognition after the sound finishes
    playSound(welcomeAudio).onended = function() {
        document.getElementById('speechBtn').click();
    };
  });

  document.getElementById("submitBtn").addEventListener("click", function () {
    var userPrompt = document.getElementById("userPrompt").value;

    // Generate a timestamped filename
    var timestamp = new Date().toISOString().replace(/[-:T.]/g, "");
    var screenshot_name = "screenshot_" + timestamp + ".png";

    // Send the blob and the prompt to your server
    uploadToServer(dataURLToBlob(img.src), screenshot_name, userPrompt);
  });

  // Check if SpeechRecognition is available
  if ("webkitSpeechRecognition" in window) {
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true; // Set to true for continuous recognition
    recognition.interimResults = true;
    
    // Variable to hold the final transcript
    var final_transcript = "";

    document.getElementById("speechBtn").addEventListener("click", function () {
      final_transcript = ''; // Reset transcript when starting a new session
      recognition.start();
      document.getElementById("stopSpeechBtn").style.display = "block"; // Show the stop button
    });

    document.getElementById("stopSpeechBtn").addEventListener("click", function () {
      recognition.stop(); // Stop recognition when user clicks the stop button
      document.getElementById("stopSpeechBtn").style.display = "none"; // Hide the stop button
    });

    recognition.onresult = function (event) {

      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        }
      }
  
      // Update the user's prompt with the final transcript
      document.getElementById("userPrompt").value = final_transcript;
    };

    recognition.onend = function () {
      document.getElementById("stopSpeechBtn").style.display = "none";
      // submit the prompt
      document.getElementById('submitBtn').click();
    };

    recognition.onerror = function(event) {
      // Handle any errors here
      console.log('Recognition error: ' + event.error);
    };
  } else {
    console.log("Speech Recognition API not supported in this browser.");
  }
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
function playSound(audioFile) {
  if (audioFile) {
    // var audioURL = chrome.runtime.getURL(soundFile);
    var audio = new Audio(audioFile);
    audio.play()
      .then(() => console.log("Audio playback started"))
      .catch(e => console.error("Error playing audio:", e));
  }
  return audio;
}

// Convert dataUrl to Blob format
function dataURLToBlob(dataUrl) {
  var byteString = atob(dataUrl.split(",")[1]);
  var mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
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

  showLoadingIndicator();
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://127.0.0.1:5000/upload', true);

  // Set timeout
  var timeout = 300000; // 300 secs, 5 mins
  var timeoutId = setTimeout(function() {
      if (xhr.readyState !== 4) {
          xhr.abort(); // cancel request
          hideLoadingIndicator();
          console.log('Upload timeout');
          playTimeoutAudio(); // play timeout audio
      }
  }, timeout);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      clearTimeout(timeoutId); 
      hideLoadingIndicator();
      if (xhr.status === 200) {
        console.log('Upload successful');
        var response = JSON.parse(xhr.responseText);
        var audioUrl = response.audio_url;
        playAudio(audioUrl);
      } else {
        console.log('Upload failed');
      }
    }
  };
  xhr.send(formData);
}


function playAudio(audioUrl) {
  var audio = document.getElementById("audioPlayer");
  var source = document.getElementById("audioSource");
  source.src = audioUrl;
  audio.load(); // call this to just preload the audio without playing
  audio.play(); // call this to play the song right away
}

function showLoadingIndicator() {
  document.getElementById("loadingIndicator").style.display = "flex";
}

function hideLoadingIndicator() {
  document.getElementById("loadingIndicator").style.display = "none";
}

function playTimeoutAudio() {
  var audio = document.getElementById('timeoutAudio');
  audio.play();
}
