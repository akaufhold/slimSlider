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

	static createSvg(svgType, align='left', sectionsTotal) {
		let circle = document.createElement('div');
		circle.classList.add('slider-transition-overlay',align);
		let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.id = `${svgType}Svg`;
		svg.classList.add(`${svgType}-amount-${sectionsTotal}`);
		svgType === 'circle' && (svg = this.createSvgCircles(svg,sectionsTotal));
		svgType === 'rect' && (svg = this.createSvgRects(svg,sectionsTotal));
		circle.appendChild(svg);
		return circle;
	}

	static createSvgCircles(svg, sectionsTotal) {
		for (var i = 0; i < sectionsTotal; i++) {
			svg.innerHTML += `<circle id="circle${i}" class="circle${i}" cx="50%" cy="50%" r="${(100/sectionsTotal*i)}%"></circle>`;
		}
		return svg;
	}

	static createSvgRects(svg, sectionsTotal) {
		for (var i = 0; i < sectionsTotal; i++) {
			svg.innerHTML += `<rect id="rect${i}" class="rect${i}" x="${100/sectionsTotal*i}%" y="0" width="${100/sectionsTotal}%" height="100%"></circle>`;
		}
		return svg;
	}

	static async createClones(originalImg, cloneType, options) {
		let cloneWrapper = document.createElement('div');
		cloneWrapper.classList.add('slider-transition-overlay');
		cloneType === 'rect' && (cloneWrapper = this.#createCloneRects(originalImg,cloneWrapper,options));
		return cloneWrapper;
	}

	static async #createCloneRects(originalImg, cloneWrapper, options) {
		let translateY = `${100*(Math.floor(options.index/options.slidesPerRow))}%`;
		let loadedImg = await this.#getLoadedElement(originalImg);
		for (var i = 0; i < options.transitionSegments; i++) {
			let clone = document.createElement('div');
			this.setElClass(clone,`slider-transition-clone`);
			this.setElStyle(clone,'transform',`translateY(${translateY})`);
			this.setElStyle(clone,'width',`${100/options.transitionSegments}%`);
			clone.appendChild(this.#createCloneRectsImages(originalImg, loadedImg, i, options));
			cloneWrapper.appendChild(clone);
		}
		return cloneWrapper;
	}

	static #createCloneRectsImages(originalImg, loadedImg, i, options){
		let clonedImg = document.createElement('img');
		clonedImg.style.transitionDelay = clonedImg.style.animationDelay = `${i/1000*(options.transitionDuration/options.transitionSegments)}s`;
		clonedImg.style.transitionDuration = `${0.3+i/1000*(options.transitionDuration/options.transitionSegments)}s`;
		clonedImg.src = originalImg.src;
		clonedImg.width = loadedImg.target.clientWidth;
		clonedImg.height = loadedImg.target.clientHeight;
		clonedImg.style.left = `${i*-100}%`;
		clonedImg.id = `slider-transition-clone-img${i}`;
		this.setElClass(clonedImg,`slider-transition-clone-img`);
		return clonedImg;
	}

	static async #getLoadedElement(element) {
		return new Promise(function (resolve, reject) {
			element.addEventListener('load',resolve);
			element.addEventListener('error', () => reject(new Error(`Failed to load img > ${image.src}`)), false);
			element.dispatchEvent(new Event('load'));
		});
	}
}