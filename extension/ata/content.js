var code = function() {
	var loc = window.location;
	var isAta = loc.hostname === 'www.atatech.org';


	function doFetch(data, cb) {
		fetch('http://127.0.0.1:3005/ata', {
				method: 'POST',
				headers: {},
				body: JSON.stringify(data)
			}).then((response) => {
				if (response.ok) {
					return response.json();
				}
			}).then((json) => {
				console.log(JSON.stringify(json));
				btn.innerHTML = JSON.stringify(json)
				cb && cb();
			}).catch((error) => {
				console.error(error);
			});
	}
	if (loc.hostname === 'www.atatech.org' || loc.hostname === 'lark.alipay.com') {
		var btn = document.createElement('button');
		btn.style.cssText = 'position: fixed; top: 40px; left: 0; height: 30px; width: 200px; z-index: 10000;';
		btn.id = 'downit';
		btn.value = 'test';

		document.body.appendChild(btn);
		document.getElementById('downit').onclick = function() {
			var title = isAta ? document.querySelector('.article-title h1').textContent : document.querySelector('h1.typo-title').textContent;
			var content = isAta ? document.querySelector('.content').outerHTML: document.querySelector('.doc-article').outerHTML;
			var href = (document.querySelector('link[href^="/assets/app"]') || {}).href || '';
			var hrefName = href.substring(href.lastIndexOf('/') + 1);
			var link = isAta ? `<link rel="stylesheet" type="text/css" href="./${hrefName}">` : '<link rel="stylesheet" type="text/css" href="./common.css"><link rel="stylesheet" type="text/css" href="./doc.css">';

			if (!isAta) {
				var name = (document.querySelector('.meta-item-last') || {}).textContent || '';
				title = name + '_' + title;
				var comment = (document.querySelector('.comment-flatten-list') || {}).innerHTML || '';
				content += comment;
			}



			content = `<!doctype html>
						<html>
						<head>
							<meta charset="utf-8" />
							${link}
						</head>
						<body>
							${content}
						</body>
						</html>`;

			doFetch({
				title: title.trim() + location.pathname.replace(/\//g, '_'),
				content: content,
				href: href,
				hrefName: hrefName,
				type: isAta ? 'ata' : 'lark'
			})
		}


		if (isAta) {
			return
		}
		var batch = document.createElement('button');
		batch.style.cssText = 'position: fixed; top: 40px; left: 220px; height: 30px; width: 200px; z-index: 10000;';
		batch.id = 'batch';
		batch.value = 'batch';
		document.body.appendChild(batch);

		function doLoop (link, titlePre, cb) {
			link.innerHTML = '';
			link.click();
			setTimeout(function () {
				var title = document.querySelector('h1.typo-title').textContent;
				var content = document.querySelector('.doc-article').outerHTML;
				var link = '<link rel="stylesheet" type="text/css" href="./common.css"><link rel="stylesheet" type="text/css" href="./doc.css">';
				content = `<!doctype html>
						<html>
						<head>
							<meta charset="utf-8" />
							${link}
						</head>
						<body>
							${content}
						</body>
						</html>`;
				doFetch({
					title: titlePre + '_' + title,
					content: content,
					type: 'lark'
				}, cb)
			}, 3000);
		}
		document.getElementById('batch').onclick = function () {
			var title = document.querySelectorAll('.header-crumb > a');
			title = title[title.length - 1].textContent;
			var folder = document.querySelectorAll('.doc-section-nav .catalog li .catalog-folder') || [];
			[].forEach.call(folder, function (node, i) {
				node.closest('li').classList.add('hasChildren')
				if (node.className.indexOf('larkicon-triangle-down-sw') !== -1) {	
				}
				node.click();
			})

			var list = document.querySelectorAll('.doc-section-nav .catalog li a');
			var start = 0;

			var cb = function () {
				if (start < list.length) {
					doLoop(list[start++], title, cb);
				}
			}
			doLoop(list[start++], title, cb)
		}

	}
}



var script = document.createElement('script');
setTimeout(function() {
	script.textContent = '(' + code + ')()';
	(document.head || document.documentElement).appendChild(script);
}, 200)