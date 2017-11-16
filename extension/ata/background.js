console.log(chrome.fileSystem.chooseEntry);



var code = function() {
    var loc = window.location;
    if (loc.hostname === 'www.atatech.org') {
      var html = `<button style="position: fixed; top: 0; left: 0;" id="downit">test</button>`;
      $('body').append(html)
      $('#downit').click( function () {
        var content = $('.content').prop('outerHTML');
        content = `<!doctype html>
            <html>
            <head>
              <meta charset="utf-8" />
            </head>
            <body>
              ${content}
            </body>
            </html>`;
          console.log(content);
      });
    } else if (loc.hostname === 'lark.alipay.com') {
      var html = `<button style="position: fixed; top: 0; left: 0;" id="downit">test</button>`;
      $('body').append(html)
      $('#downit').click( function () {
        var content = $('.doc-article').prop('outerHTML');
        content = `<!doctype html>
            <html>
            <head>
              <meta charset="utf-8" />
            </head>
            <body>
              ${content}
            </body>
            </html>`;
          console.log(content);
      });
    }
}



/*
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
	console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
    if (msg == "tab_url") {
    	var arr = [];
	  	chrome.tabs.query({},function(tabs){     
		    tabs.forEach(function(tab){
		      arr.push(tab.url);
		    });
		});
	  	//sendResponse(JSON.stringify(arr));
    }

    sendResponse('123')
});
*/


/*
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {          
   if (changeInfo.status == 'complete') {   
      	console.log('ddddddd');
         chrome.tabs.sendMessage(tabs[0].id, {action: "SendIt"}, function(response) {
         });  
      });
   }
});
*/




