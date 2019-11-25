// 通过postMessage调用content-script
function invokeContentScript(code)
{
	window.postMessage({cmd: 'invoke', code: code}, '*');
}
// 发送普通消息到content-script
function sendMessageToContentScriptByPostMessage(data)
{
	window.postMessage({cmd: 'message', data: data}, '*');
}

// 通过DOM事件发送消息给content-script
(function() {
	var customEvent = document.createEvent('Event');
	customEvent.initEvent('myCustomEvent', true, true);
	// 通过事件发送消息给content-script
	function sendMessageToContentScriptByEvent(data) {
		data = data || '你好，我是injected-script!';
		var hiddenDiv = document.getElementById('myCustomEventDiv');
		hiddenDiv.innerText = data
		hiddenDiv.dispatchEvent(customEvent);
	}
	window.sendMessageToContentScriptByEvent = sendMessageToContentScriptByEvent;
	window.addEventListener("message", function (event) {
		// We only accept messages from ourselves
		if (event.source != window) { return; }

		// Make sure we're looking at the correct event:
		if (event.data.type && (event.data.type == "invokeContentScript")) {
			window.postMessage({cmd: 'invoke', code: event.data.text}, '*');
		}
	}, false);
})();

