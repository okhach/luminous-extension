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

  