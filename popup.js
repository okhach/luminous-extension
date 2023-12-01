document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('captureBtn').addEventListener('click', function() {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
      chrome.tabCapture.capture({audio: true, video: false}, function(stream) {

        var welcomeAudio = "welcome.mp3";

        // Convert Data URL to Blob
        var blob = dataURLToBlob(dataUrl);

        // Send the blob to your server
        var timestamp = new Date().toISOString().replace(/[-:T.]/g, '');
        var screenshot_name = 'screenshot_' + timestamp + '.png';
        uploadToServer(blob, screenshot_name);

        //create new Image
        createImg(dataUrl);
        
        //Generate text box after image
        generateTxtAndButton();
  
        // Play the welcome audio first
        playSound(welcomeAudio);

        startRecording();

      });       
    });
  });
});

function startRecording() {
  // var startBtn = document.getElementById('startButton');
  var textBox = document.getElementById('userInput');

  // 检查浏览器是否支持语音识别
  var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
  if (typeof SpeechRecognition === "undefined") {
    textBox.placeholder = "Sorry! Your browser does not support audio recognition.";
  } else {
    var recognition = new SpeechRecognition();
    recognition.continuous = true; // 持续识别
    recognition.interimResults = true; // 返回临时结果
    recognition.lang = "en-US"; // 设置语言为英语

    recognition.onresult = function(event) {
      var transcript = '';
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      textBox.value = transcript;
    };

    recognition.onerror = function(event) {
      console.error("Audio recognition error: ", event.error);
    };

    recognition.start();
  }
}


function createImg(dataUrl){
var oldImg = document.querySelector('.screenshot-image');
if (oldImg) {
  document.body.removeChild(oldImg);
}
var img = new Image();
img.src = dataUrl;
img.className = 'screenshot-image';
document.body.appendChild(img);
}

function generateTxtAndButton(){
var oldInputBox = document.querySelector('input[type="text"]');
if (oldInputBox) {
  document.body.removeChild(oldInputBox);
}

var oldStartButton = document.querySelector('button[type="button"]');
if (oldStartButton) {
  document.body.removeChild(oldStartButton);
}


var inputBox = document.createElement('input');
inputBox.type = 'text';
inputBox.placeholder = 'Message ChatGPT';
inputBox.id = 'userInput';
document.body.appendChild(inputBox);

//button
var startButton = document.createElement('button');
startButton.type = 'button';
startButton.textContent = 'Start Recording';
startButton.id = 'startButton'; 
startButton.addEventListener('click', startRecording, false);
document.body.appendChild(startButton);
}

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