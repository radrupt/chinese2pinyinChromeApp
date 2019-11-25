let idDom = document.getElementById('identify');

chrome.storage.sync.get('userid', function(items) {
  idDom.innerHTML = "<span style='color: #a0a0a0;'>id: </span>" + items.userid
});