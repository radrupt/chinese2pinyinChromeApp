chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.get('token', function(items) {
    var token = items.token;
    if (token) {
        useToken(token);
    } else {
        token = getRandomToken();
        chrome.storage.sync.set({token: token}, function() {
          fetch('https://divergence.radru.com/trans/createByToken?token='+token);
          useToken(token);
        });
    }
    function useToken(token) {
      
    }
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'developer.chrome.com'},
      })
      ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});



function getRandomToken() {
	// E.g. 8 * 32 = 256 bits token
	var randomPool = new Uint8Array(32);
	crypto.getRandomValues(randomPool);
	var hex = '';
	for (var i = 0; i < randomPool.length; ++i) {
		hex += randomPool[i].toString(16);
	}
	// E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
	return hex;
}