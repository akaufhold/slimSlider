export default class SliderHelpers {
	interval;

	constructor() {

	}

	static clearInterval(){
		clearInterval(this.interval);
	}

	static wait (sec) {
		return new Promise((res) => {setTimeout(res, sec * 1000)});
	}

	static loop(sec) {
		return new Promise((res) => {
			clearInterval(this.interval);
			this.interval = setInterval(res, sec * 1000);
		})
	}

	static setElStyle(el, styleProp, value) {
		el.style[styleProp] = value;
	}

	static setElClass(el,cssClass) {
		el.classList.add(cssClass);
	}

	static wrapAround(el, wrapper) {
		(el.length > 1 && el.nodeType !== 3) ? el.forEach(el => wrapper.appendChild(el)) : wrapper.appendChild(el);
		return wrapper;
	}

	static isEven(value){
		if (value%2 === 0)
			return true;
		else return false;
	}

	static isFirst(value, slidesPerRow){
		if ((value+1)%slidesPerRow === 1)
			return true;
		else return false;
	}

	static isLast(value, slidesPerRow){
		if ((value+1)%slidesPerRow === 0)
			return true;
		else return false;
	}

	static createWrapperElement (cssClass, htmlElType='div') {
		let wrapper = document.createElement(htmlElType);
		(cssClass != '') && SliderHelpers.setElClass(wrapper,cssClass);
		return wrapper;
	}

	static waitForElement(querySelector, timeout) {
		return new Promise((resolve, reject)=> {
			var timer = false;
			//console.log(querySelector);
			if(document.querySelectorAll(querySelector).length) return resolve();
			const observer = new MutationObserver(() => {
				if(document.querySelectorAll(querySelector).length) {
					observer.disconnect();
					if(timer !== false) clearTimeout(timer);
					return resolve();
				}
			});
			observer.observe(document.body, {
				childList: true, 
				subtree: true
			});
			if(timeout) timer = setTimeout(() => {
				observer.disconnect();
				reject();
			}, timeout);
		});
	}

	static createCircleSvg(align='left') {
		let circle = document.createElement('div');
		circle.classList.add(align);
		circle.innerHTML = `<svg id="circleSvg" class="circle" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
		for (var i = 0; i < 9; i++) {
			circle.innerHTML += `<circle id="circle${i}" class="circle${i} steap" cx="0px" cy="49%" r="${(i*12.5)-12.5}%"></circle>`;
		}		
		circle.innerHTML += `</svg>`;
		return circle;
	}
}