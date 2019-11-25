document.addEventListener('DOMContentLoaded', function(event) {
    init()
});
// var host = 'http://localhost:3000'
var host = 'https://divergence.radru.com'
var token;
var popup;
var pinyinPopup;
var getFixedPosition;
var g_selectedText;
function init() {
	injectCustomJs();
	
	getFixedPosition = () => {
		const selection = window.getSelection();
		if (selection.rangeCount === 0) return null;
		const clientRect = selection.getRangeAt(0).getBoundingClientRect();
		let {
			top, bottom, left, right, width, height
		} = clientRect;
		const scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
		top += scrollTop;
		bottom += scrollTop;
		const scrollLeft = document.body.scrollLeft;
		left += scrollLeft;
		right += scrollLeft;
		return {top, bottom, left, right, width, height};
	};
	
	pinyinPopup = document.createElement("div")
	pinyinPopup.style.position = "absolute";
	pinyinPopup.style.border = "2px black solid";
	pinyinPopup.style.background = "white";
	pinyinPopup.style.padding = "2px";
	pinyinPopup.style.display = "none";
	pinyinPopup.style.zIndex = 99999999999
	document.body.append(pinyinPopup);

	popup = document.createElement("div");
	popup.style.position = "absolute";
	popup.style.border = "2px black solid";
	popup.style.background = "white";
	popup.style.padding = "2px";
	popup.style.display = "none";
	popup.style.zIndex = 99999999999
	document.body.append(popup);
	
	{
		
		popup.innerHTML = `
			<div class="btn-area">
				<a id="pinyin">拼</a>
				<a id="chinese">中</a>
			</div>
		</div>
	`;
	}
	document.getElementById('pinyin').onclick = function() {
		window.postMessage({
			type: "invokeContentScript",
			text: "viewPinyin()"
		}, "*");
	};
	document.getElementById('chinese').onclick = function() {
		window.postMessage({
			type: "invokeContentScript",
			text: "viewChinese()"
		}, "*");
    };
	const updateMenu = () => {
		const selectedText = window.getSelection().toString().trim();
		const position = getFixedPosition();
		if (selectedText && position && position.width) {
			g_selectedText = selectedText
			popup.style.display = "";
			const top = position.top - 32;
			const left = position.left + (position.width - popup.offsetWidth) / 2;
			popup.style.top = `${top}px`;
			popup.style.left = `${left}px`;
			pinyinPopup.style.display = "none"
		} else {
			popup.style.display = "none";
			pinyinPopup.style.display = "none";
		}
	};
	
	const debounce = (func, delay_ms) => {
		let timeoutID = null;
		return () => {
			if (isFinite(timeoutID)) {
				clearTimeout(timeoutID);
			}
			timeoutID = setTimeout(func, delay_ms);
		};
	};
	
	{
		const delay_ms = 160;
		const debouncedUpdateMenu = debounce(updateMenu, delay_ms);
		document.addEventListener("mouseup", () => {
			const selectedText = window.getSelection().toString().trim();
			if(!selectedText) {
				popup.style.display = "none";
			}
			if(popup.style.display !== 'none') {
				return
			}
			popup.style.display = "none";
			debouncedUpdateMenu();
		});
		document.addEventListener("click", () => {
			setTimeout(
				() => {
					const selectedText = window.getSelection().toString().trim();
					if(!selectedText) {
						popup.style.display = "none";
					}
				}
			)
			debouncedUpdateMenu()
		});
	}
	
}

function sendMessageToBackground(message) {
	chrome.runtime.sendMessage({greeting: message || '你好，我是content-script呀，我主动发消息给后台！'}, function(response) {
		tip('收到来自后台的回复：' + response);
	});
}

function injectCustomJs(jsPath)
{
	jsPath = jsPath || 'js/inject.js';
	var temp = document.createElement('script');
	temp.setAttribute('type', 'text/javascript');
	// 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
	temp.src = chrome.extension.getURL(jsPath);
	temp.onload = function()
	{
		// 放在页面不好看，执行完后移除掉
		this.parentNode.removeChild(this);
	};
	document.body.appendChild(temp);
}

async function postFormData(url = '', data = {}, headers = {}) {
	// Default options are marked with *
	const searchParams = Object.keys(data).map((key) => {
		return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
	  }).join('&');
	const response = await fetch(url, {
	  method: 'POST', // *GET, POST, PUT, DELETE, etc.
	  cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
	  headers: {
		'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
		...headers
	  },
	  redirect: 'follow', // manual, *follow, error
	  referrer: 'no-referrer', // no-referrer, *client
	  body: searchParams // body data type must match "Content-Type" header
	});
	return await response.text(); // parses JSON response into native JavaScript objects
  }

function viewPinyin() {
	popup.style.display = "none";
	const position = getFixedPosition();
	const top = popup.style.top;
	const left = popup.style.left;
	pinyinPopup.style.top = top;
	pinyinPopup.style.left = left;
	postFormData(`${host}/trans/pinyin`, {text: g_selectedText}, {token})
	.then(function(response) {
		setTimeout(
			() => {
				pinyinPopup.innerHTML = `
						<div class="btn-area">
							${response}
						</div>
					</div>
				`;
				pinyinPopup.style.display = "";
			}, 140
		)
	})
	
}

function viewChinese() {
	popup.style.display = "none";
	const position = getFixedPosition();
	const top = popup.style.top;
	const left = popup.style.left;
	pinyinPopup.style.top = top;
	pinyinPopup.style.left = left;
	postFormData(`${host}/trans/chinese`, {text: g_selectedText}, {token})
	.then(function(response) {
		setTimeout(
			() => {
				pinyinPopup.innerHTML = `
						<div class="btn-area">
							${response}
						</div>
					</div>
				`;
				pinyinPopup.style.display = "";
			}, 140
		)
	})
	
}

window.addEventListener("message", function(e)
{
	if(e.data && e.data.cmd == 'invoke') {
		eval('('+e.data.code+')');
	}
	else if(e.data && e.data.cmd == 'message') {
		tip(e.data.data);
	}
}, false);

chrome.storage.sync.get('token', function(items) {
	if(items.token) {
		var token = items.token;
	}
});
