document.addEventListener("DOMContentLoaded", function () {
  var img; // Variable to hold the captured image
  document.getElementById("captureBtn").addEventListener("click", function () {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
      // Convert Data URL to Blob
      var blob = dataURLToBlob(dataUrl);

      // Show the image after screenshot
      img = new Image();
      img.src = dataUrl;
      // Set image style to fit within the extension window
      img.className = "screenshot-image";
      document.body.appendChild(img);

      // Show the prompt input and submit button
      document.getElementById("promptSection").style.display = "block";
    });

    // Play the start recording sound
    var audio = new Audio('https://msaiclassroom.blob.core.windows.net/beep-audio/tell-me-your-question.mp3');
    audio.play();

    // Start the speech recognition after the sound finishes
    audio.onended = function() {
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
  formData.append("file", blob, fileName);
  formData.append("prompt", userPrompt);

  showLoadingIndicator();
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "http://127.0.0.1:5000/upload", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      hideLoadingIndicator();
      console.log("Upload successful");
      var response = JSON.parse(xhr.responseText);
      var audioUrl = response.audio_url;
      playAudio(audioUrl);
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
