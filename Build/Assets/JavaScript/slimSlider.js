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
		type: 'slider', /* slider or gallery */
		sliderClass:"slider",
		sliderWrapperClass: "slider-wrapper",
		loop: true, 
		autoplay: true,
		delay: 6,
		transition: 'fade',
		transitionTiming: 'linear',
		slidesPerRow: 1,
		slidesPerColumn: 1,
		slidesRowWrap: false,
		margin: 0,
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
			this.opts.type=='slider' && this.createSlider();
			await this.slideTransition();
		}
	}

	clearLoop() {
		clearInterval(this.interval);
	}

	setCurSlidesClasses(indexArr) {
		indexArr.forEach((el) => this.sliderElements[el].classList.add(this.curElementClass));
	}

	setPrevSlidesClasses(indexArr) {
		indexArr.forEach((el) => this.sliderElements[el].classList.add(this.prevElementClass));
	}

	deleteSliderClasses() {
		this.sliderElements.forEach((el) => el.classList.remove(this.curElementClass,this.prevElementClass));
	}

	//filterLastElements

	setSliderStyles() {
		switch (this.opts.transition) {
			case 'fade':
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
		indexArr.forEach((el) => SliderHelpers.setElementStyle(this.sliderElements[el],styleProp,styleVal));
	}

	setSliderClassesAndStyles() {
		this.deleteSliderClasses();
		this.setCurSlidesClasses([this.imgCurIndex]);
		this.setPrevSlidesClasses([this.lastInd]);
		this.setSliderStyles();
	}

	showNextSlides() {
		this.setSliderClassesAndStyles();
	}

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

	getCssTransitionProp() {
		try{
			return this.transitions[this.opts.transition];
		}
		catch(err){
			new Error('Transition not found');
		}
	}

	setContainerStyles(el) {
		this.setContainerStylesGrid(el);
		el.style.transitionProperty 	= this.getCssTransitionProp();
	}

	getGridColumnString() {
		let gridTemplateColumnsString = '';
		for (let i=0; i<this.opts.slidesPerRow; i++){
			gridTemplateColumnsString += `1fr `;
		}
		return `${gridTemplateColumnsString.slice(0,-1)}`;
	}

	setContainerStylesGrid(el) {
		SliderHelpers.setElementStyle(el,'display','grid');
		SliderHelpers.setElementStyle(el,'justifyContent','center');
		SliderHelpers.setElementStyle(el,'gridTemplateColumns',this.getGridColumnString());
		this.opts.margin && SliderHelpers.setElementStyle(el,'gridColumnGap',`${this.opts.margin}px`);
	}

	createSlider() {
		try{
			let parentStyles = this.#sliderContainer;
			this.createSliderElements();
			if (this.opts.slidesPerRow > 1){
				this.#sliderWrapper = parentStyles = this.createSliderWrapper();
			}
			this.setContainerStyles(parentStyles);
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
		this.images.length && this.deleteImages();
		this.imgsLoaded.forEach((el,index) => {
			let sliderElement = new SliderElement(this.opts,this.#sliderContainer,el,index);
			this.sliderElements.push(sliderElement.childnode);
		});
	}

	async createImage(path) {
		return new Promise(function(res,rej){
			let image = document.createElement('img');
			image.src = path;
			image.addEventListener('load', () => res(image), false);
			image.addEventListener('error', () => rej(new Error(`Failed to load img > ${image.src}`)), false);
		});
	}

	async loadSingleImage(path) {
		try {
			return await this.createImage(path)
		}
		catch(err){
			console.error(err)
		}
	};

	async deleteImages() {
		this.#sliderContainer.innerHTML = ''; 
	}

	async #loadAllImages() {
		try{
			if (!this.imgsLoaded){
				return await Promise.all(this.images.map(async image => this.loadSingleImage(image)));
			}		
		}catch(error){
			new Error(`Image loading failed `); 
		}
	};
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
				`Waiting (Observer) for elements failed in 'SliderHelpers.waitForElement' \r\n 
				Promise for following elements could not be resolved:\r\n`,
				this.allSliderElements,
				`Element heights could not be returned \r\n`
			);
		}
	}

	async setWrapperHeight(el) {
		this.getWrapperMaxHeight().then((res) => {
			this.wrapper.style.maxHeight = `${res}px`;
		})
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
		this.setElementClasses(this.childnode);
		this.addImageToContainer(this.childnode);
	}

	setElementStyles(el) {
		let curColumn = (this.index+1)%this.opts.slidesPerRow;
		SliderHelpers.setElementStyle(el,'gridRowStart',1);
		(curColumn===0)
			?SliderHelpers.setElementStyle(el,'gridColumnStart',this.opts.slidesPerRow)
			:SliderHelpers.setElementStyle(el,'gridColumnStart',curColumn);
	}

	setElementClasses(el) {
		this.opts.zoomOnHover && el.classList.add('zoom');
	}

	addImageToContainer(el) {
		this.opts.type=='gallery' && el.classList.add('parallel');
		this.#sliderContainer.insertAdjacentElement('beforeend', el);
	}
}

const slider1 = new Slider(
	{
		type:'slider', 
		sliderClass: 'slider',
		slidesPerRow: 1,
		slidesRowWrap: true,
		margin: 0,
		zoomOnHover: false
	},
	'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg','Public/Images/img-4.jpg','Public/Images/img-5.jpg','Public/Images/img-6.jpg'
);