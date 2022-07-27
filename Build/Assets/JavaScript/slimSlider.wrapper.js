import SliderHelpers from './slimSlider.helpers';

export default class SliderWrapper {
	#container;
	wrapper;
	wrapperDomElement;
	elementsToWrap;
	#opts;

	constructor(options, container, elementsToWrap){
		this.#opts 					= options;
		this.#container 		= container;
		this.elementsToWrap = elementsToWrap;
		this.init();
	}

	init(){
		this.wrapper = SliderHelpers.wrapAround(this.elementsToWrap,SliderHelpers.createWrapperElement(this.#opts.sliderWrapperClass));
		this.#container.innerHTML = '';
		this.#container.insertAdjacentElement('afterbegin',this.wrapper);
		this.wrapperDomElement = document.querySelector(`.${this.#opts.sliderWrapperClass}`);
		this.setWrapperHeight();
		!this.#opts.slidesRowWrap && this.setWrapperWidth();
	}

	getImagesForWrapperMaxHeight(){
		if ([...this.elementsToWrap].filter(el => el.nodeName==='DIV').length){
			return [...this.elementsToWrap].filter(el => el.nodeName==='DIV').map(el => el.childNodes[0]);
		}
		else
			return [...this.elementsToWrap];
	}

	async setWrapperHeight(el) {
		this.getWrapperMaxHeight().then((res) => this.wrapper.style.maxHeight = `${res}px`);
	}

	setWrapperWidth(){
		let wrapperWidth = `${(this.elementsToWrap.length/this.#opts.slidesPerRow)*100}%`;
		this.wrapperDomElement.style.width = wrapperWidth;
	}

	async getWrapperMaxHeight() {
		try {
			let imagesTarget = this.getImagesForWrapperMaxHeight();
			let sliderElementsHeights = await Promise.all(imagesTarget.map(async (el,index) => {
				await SliderHelpers.waitForElement(`.${this.#opts.sliderWrapperClass}`,10);
				return Number(parseInt(window.getComputedStyle(el).height));
			}));
			return Math.min(...sliderElementsHeights);
		}
		catch(err) {
			console.error(
				`Error in 'SliderHelpers.waitForElement' \r\n 
				Promise for following elements could not be resolved:\r\n`,
				this.allSliderElements,
				`Element heights could not be returned \r\n`
			);
		}
	}
}
