document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('captureBtn').addEventListener('click', function() {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(dataUrl) {
        var img = new Image();
        img.src = dataUrl;
        document.body.appendChild(img);
      });
    });
  });
  