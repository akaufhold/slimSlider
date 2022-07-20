/* SERVICE WORKER */

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/Public/JavaScript/sw.js', {scope: '/', registrationStrategy: 'registerImmediately'}).then(function(registration) {
			console.log('succeeded');
		}).catch(function(error) {
			console.log(error); 
		});
	});
} else {
  // Der verwendete Browser unterstützt Service Worker nicht.
  let aElement = document.createElement('a');
  aElement.href = 'http://www.chromium.org/blink/serviceworker/service-worker-faq';
  aElement.textContent = 'unavailable';
  console.log(aElement);
}
