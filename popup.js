document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('captureBtn').addEventListener('click', function() {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
        // Convert Data URL to Blob
        var blob = dataURLToBlob(dataUrl);

        // Send the blob to your server
        uploadToServer(blob, 'screenshot.png');
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