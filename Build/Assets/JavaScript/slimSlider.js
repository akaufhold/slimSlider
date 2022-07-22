'use strict';

require("../Scss/slimSlider.scss");

class SliderHelpers {
	constructor() {

	}

	static wait (sec) {
		return new Promise((res) => {setTimeout(res, sec * 1000)});
	}

	static loop(sec) {
		return new Promise((res) => {setInterval(res, sec * 1000)})
	}

	static setElementStyle(el, styleProp, value) {
		el.style[styleProp] = value;
	}

	static waitForElement(querySelector, timeout) {
		return new Promise((resolve, reject)=> {
			var timer = false;

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
}

class Slider {
	#sliderContainer;
	#sliderWrapper = false;
	sliderElements = [];
	imgsLoaded = false;
	
	imgCurIndex = 0;
	lastInd;
	imgCount = 0;
	curElementClass = 'cur-image';
	prevElementClass = 'prev-image';
	sliderElementsHeights = '100vh';

	opts;
	options = {
		autoplay: true,
		delay: 6,
		loop: true, 
		margin: 0,
		slidesPerRow: 1,
		slidesPerColumn: 1,
		slidesRowWrap: false,
		sliderClass:"slider",
		sliderWrapperClass: "slider-wrapper",
		transition: 'fade',
		transitionTiming: 'linear',
		type: 'slider', /* slider or gallery */
		vignette: false,
		zoomOnHover: true
	}

	transitions = {
		fade: 'opacity',
		slide: 'transform',
		rotate: 'transform'
	}

	constructor(
		options = {},
		...images
	){
		for (const option of Object.entries(options)){
			this.options[option[0]] = options[option[0]] || option[1];
		}
		this.opts 		= this.options;
		this.images 	= images;
		this.imgCount = images.length;
		this.lastInd 	= this.imgCount-1;
		this.opts.loop && (this.interval = '');
		this.init();
	}

	async init() {
		try{
			this.#sliderContainer 	= document.querySelector(`.${this.opts.sliderClass}`);
			this.imgsLoaded 		 		= await this.#loadAllImages(this.opts);
		}
		catch(err){
			console.error(err);
			throw new Error('Slider initialising failed');
		}
		finally{
			this.opts.type == 'slider' && this.createSlider();
			await this.slideTransition();
		}
	}
	/* LATER USE
	clearLoop() {
		clearInterval(this.interval);
	}*/

	addToClassList(indexArr,cssClass) {
		indexArr.forEach((el) => this.sliderElements[el].classList.add(cssClass));
	}

	deleteClasses() {
		this.sliderElements.forEach((el) => el.classList.remove(this.curElementClass,this.prevElementClass));
	}

	/* LAZYLOADING IMAGES */

	async #loadAllImages() {
		try{
			if (!this.imgsLoaded){
				return await Promise.all(this.images.map(async image => this.#loadSingleImage(image)));
			}		
		}catch(error){
			new Error(`Image loading failed `); 
		}
	};

	async #loadSingleImage(path) {
		try {
			return await this.#createImage(path)
		}
		catch(err){
			console.error(err)
		}
	};

	async #createImage(path) {
		return new Promise(function(res,rej){
			let image = document.createElement('img');
			image.src = path;
			image.addEventListener('load', () => res(image), false);
			image.addEventListener('error', () => rej(new Error(`Failed to load img > ${image.src}`)), false);
		});
	}

	async #deleteImages() {
		this.#sliderContainer.innerHTML = ''; 
	}

	/* CREATE SLIDER, WRAPPER AND ELEMENTS */

	createSlider() {
		try{
			let parentStyles = this.#sliderContainer;
			this.createSliderElements();
			if (this.opts.slidesPerRow > 1){
				this.#sliderWrapper = parentStyles = this.createSliderWrapper();
			}
			this.setContainerCss(parentStyles);
		}
		catch(err){
			console.log(err);
			new Error('Slider not created');
		}
	}

	createSliderWrapper(){
		let sliderWrapper = new SliderWrapper(this.opts,this.#sliderContainer,this.sliderElements);
		return document.querySelector(`.${sliderWrapper.wrapper.className}`);
	}

	createSliderElements() {
		this.images.length && this.#deleteImages();
		this.imgsLoaded.forEach((el,index) => {
			let sliderElement = new SliderElement(this.opts,this.#sliderContainer,el,index);
			this.sliderElements.push(sliderElement.childnode);
		});
	}

	/* TRANSITION AND STYLES */

	async slideTransition() {
		try{
			this.showNextSlides();
		}
		catch(err){
			console.error(err);
			new Error('Slider not showing next image');
		}
		finally{
			let lastSlide = (this.imgCurIndex+1) === this.imgCount;
			if (this.opts.loop || (!lastSlide)){
				this.interval = await SliderHelpers.loop(this.opts.delay);
				this.lastInd = this.imgCurIndex;
				lastSlide ? this.imgCurIndex=0 : this.imgCurIndex++;
				await this.slideTransition();
			}
		}
	}

	showNextSlides() {
		this.setClassesAndStyles();
	}

	setClassesAndStyles() {
		this.deleteClasses();
		this.addToClassList([this.imgCurIndex],this.curElementClass);
		this.addToClassList([this.lastInd],this.prevElementClass);
		this.setStylesForTransition();
	}

	getCssTransitionProp() {
		try{
			return this.transitions[this.opts.transition];
		}
		catch(err){
			new Error('Transition not found');
		}
	}

	setContainerCss(el) {
		this.setContainerCssGrid(el);
		el.style.transitionProperty 	= this.getCssTransitionProp();
	}

	setContainerCssGrid(el) {
		SliderHelpers.setElementStyle(el,'display','grid');
		SliderHelpers.setElementStyle(el,'justifyContent','center');
		SliderHelpers.setElementStyle(el,'gridTemplateColumns',this.getGridColumnString());
		this.opts.margin && SliderHelpers.setElementStyle(el,'gridColumnGap',`${this.opts.margin}px`);
	}

	getGridColumnString() {
		let gridTemplateColumnsString = '';
		for (let i=0; i<this.opts.slidesPerRow; i++){
			gridTemplateColumnsString += `1fr `;
		}
		return `${gridTemplateColumnsString.slice(0,-1)}`;
	}

	setStylesForTransition() {
		switch (this.opts.transition) {
			case 'fade':
				this.setSlideStyles('*','opacity','0');
				this.setSlideStyles([this.imgCurIndex],'opacity','1');
				this.setSlideStyles([this.lastInd],'opacity','0');
				break;
			case 'fade':
				this.setSlideStyles([this.imgCurIndex],'opacity','1');
				this.setSlideStyles([this.lastInd],'opacity','0');
				break;
			default:
				this.setSlideStyles([this.imgCurIndex],'opacity','1');
				this.setSlideStyles([this.lastInd],'opacity','0');
				break;
		}
	}

	setSlideStyles(indexArr, styleProp, styleVal) {
		indexArr === '*' && this.sliderElements.forEach((el) => SliderHelpers.setElementStyle(el,styleProp,styleVal));
		indexArr !== '*' && indexArr.forEach((el) => SliderHelpers.setElementStyle(this.sliderElements[el],styleProp,styleVal));
	}
}

class SliderWrapper {
	container;
	wrapper;
	wrapperDomElement;
	allSliderElements;
	#opts;

	constructor(options, container, allSliderElements){
		this.#opts 							= options;
		this.container 					= container;
		this.allSliderElements 	= allSliderElements;
		this.init();
	}

	init(){
		this.wrapper = this.wrapAround(this.allSliderElements,this.createWrapperElement());
		this.container.innerHTML = '';
		this.container.insertAdjacentElement('afterbegin',this.wrapper);
		this.wrapperDomElement = document.querySelector(`.${this.#opts.sliderWrapperClass}`);
		this.setWrapperHeight();
	}

	wrapAround(el, wrapper) {
			el.forEach(el => wrapper.appendChild(el));
			return wrapper;
	}

	createWrapperElement() {
		let wrapper = document.createElement('div');
		wrapper.classList.add(this.#opts.sliderWrapperClass);
		return wrapper;
	}

	async setWrapperHeight(el) {
		this.getWrapperMaxHeight().then((res) => this.wrapper.style.maxHeight = `${res}px`);
	}

	async getWrapperMaxHeight() {
		try {
			let sliderElementsHeights = await Promise.all([...this.allSliderElements].map(async (el,index) => {
				await SliderHelpers.waitForElement(`.${this.#opts.sliderWrapperClass}`,0);
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

class SliderElement {
	#sliderContainer
	childnode;
	opts;
	index;

	constructor(
		options,
		sliderContainer,
		element,
		index
	){
		for (const option of Object.entries(options)) {
			this.opts = options;
		}
		this.#sliderContainer = sliderContainer;
		this.childnode 				= element;
		this.index 						= index;
		this.init();
	}

	init() {
		this.setElementStyles(this.childnode);
		this.addElementClassesFromOptions('type','gallery','parallel');
		this.addElementClassesFromOptions('zoomOnHover',true,'zoom');
		this.addElementToContainer(this.childnode);
	}

	setElementStyles(el) {
		let curColumn = (this.index+1)%this.opts.slidesPerRow;
		SliderHelpers.setElementStyle(el,'gridRowStart',1);
		(curColumn === 0)
			?SliderHelpers.setElementStyle(el,'gridColumnStart',this.opts.slidesPerRow)
			:SliderHelpers.setElementStyle(el,'gridColumnStart',curColumn);
	}

	addElementClassesFromOptions(optionName,optionValue,cssClass) {
		(this.opts[optionName] == optionValue) && this.setElementClasses(this.childnode,cssClass);
	}

	setElementClasses(el,cssClass) {
		el.classList.add(cssClass);
	}

	addElementToContainer(el) {
		el.classList.add();
		this.#sliderContainer.insertAdjacentElement('beforeend', el);
	}
}

const slider1 = new Slider(
	{
		type:'slider', 
		sliderClass: 'slider',
		slidesPerRow: 3,
		slidesRowWrap: true,
		margin: 0,
		zoomOnHover: true
	},
	'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg','Public/Images/img-4.jpg','Public/Images/img-5.jpg','Public/Images/img-6.jpg'
);