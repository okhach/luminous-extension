document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('captureBtn').addEventListener('click', function() {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
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
      });
    });
});

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
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log('Upload successful');
    }
  };
  xhr.send(formData);
}