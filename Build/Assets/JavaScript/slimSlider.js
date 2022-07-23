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

	static setElStyle(el, styleProp, value) {
		el.style[styleProp] = value;
	}

	static setElClass(el,cssClass) {
		el.classList.add(cssClass);
	}

	static wrapAround(el, wrapper) {
		(el.length > 1) ? el.forEach(el => wrapper.appendChild(el)) : wrapper.appendChild(el);
		return wrapper;
	}

	static createWrapperElement(cssClass) {
		let wrapper = document.createElement('div');
		SliderHelpers.setElClass(wrapper,cssClass);
		return wrapper;
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
	
	imgCount = 0;
	curIndex = [0];
	lastIndex;
	othIndex;

	incIndex = 1;

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
		this.opts.loop && (this.interval = '');
		this.setAllIndexes(true);
		this.setIndexIncrement();
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
			await this.slideTransition('right');
		}
	}
	/* LATER USE
	clearLoop() {
		clearInterval(this.interval);
	}*/

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

	createSliderWrapper() {
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

	/* SET CSS FOR SLIDER CONTAINER */

	setContainerCss(el) {
		this.setContainerCssGrid(el);
		el.style.transitionProperty 	= this.getCssTransitionProp();
	}

	getCssTransitionProp() {
		try{
			return this.transitions[this.opts.transition];
		}
		catch(err){
			new Error('Transition not found');
		}
	}

	setContainerCssGrid(el) {
		SliderHelpers.setElStyle(el,'display','grid');
		SliderHelpers.setElStyle(el,'justifyContent','center');
		SliderHelpers.setElStyle(el,'gridTemplateColumns',this.getGridColumnString());
		this.opts.margin && SliderHelpers.setElStyle(el,'gridColumnGap',`${this.opts.margin}px`);
	}

	getGridColumnString() {
		let gridTemplateColumnsString = '';
		for (let i=0; i<this.opts.slidesPerRow; i++){
			gridTemplateColumnsString += `1fr `;
		}
		return `${gridTemplateColumnsString.slice(0,-1)}`;
	}


	/* SETS AND CHECK INDEXES FOR CURRENT, LAST AND OTHER ELEMENTS */

	setIndexIncrement() {
		this.incIndex = this.getIndexesArray('slidesPerRow',true).length;
	}

	setAllIndexes(start = false, direction='right') {
		console.log(start,direction);
		this.setLastIndexes(start);
		this.setCurrentIndexes(start, direction);
		this.setOtherIndexes(this.curIndex,this.lastIndex);
	}

	getIndexesArray(prop, opts = false) {
		return [...Array(opts?this.opts[prop]:this[prop]).keys()];
	}

	setLastIndexes(start = false) {
		if (start){
			let lastSliceIndex =  this.incIndex * -1;
			this.lastIndex = this.getIndexesArray('imgCount').splice(lastSliceIndex);
		} else {
			this.lastIndex = this.curIndex;
		}
	}

	setCurrentIndexes(start = false, direction) {
		let initialIndexes = this.getIndexesArray('slidesPerRow',true);
		if (start || this.checkForCurIndex()) {
			this.curIndex = initialIndexes;
		} else{
			this.curIndex = this.curIndex.map((value) => {
				if (direction==='right')
					return value + this.incIndex;
				else
					return value - this.incIndex;
			});
		}
	}

	setOtherIndexes(curIndex,lastIndex) {
		this.othIndex = this.getIndexesArray('imgCount').filter(el => {
			let checkLast = curIndex.includes(el);
			let checkCurs = lastIndex.includes(el);
			return (!checkLast && !checkCurs);
		});
		//console.log(this.othIndex);
	}

	checkForCurIndex(direction='right') {
		return this.curIndex.includes(direction==='right'?this.imgCount-1:0);
	}

	/* CREATE SLIDER CONTROL ELEMENTS */
		
	/*Slide (cur) {
		SingleSlides.forEach((slide,index) => slide.style.transform = `translateX(${(index-cur)*100}%)`);
	}*/

	createDots() {
		SingleSlides.forEach((_,index) => {
			DotContainer.insertAdjacentHTML('beforeEnd',`<div class="dots__dot" data-slide="${index}"></div>`);
		})
	}

	setActiveDot(slide) {
		DotContainer.querySelectorAll('.dots__dot').forEach((el,index) => {
			el.classList.remove('dots__dot--active');
		});
		document.querySelector(`.dots__dot[data-slide="${slide}"]`).classList.add('dots__dot--active')
		//(index===slide) && el.classList.add('dots__dot-active');
	}

	sliderControls() {
		this.#sliderEvents();
	}

	#sliderEvents() {
		this.#sliderEventsArrow();
		this.#sliderEventKeys();
		this.#sliderEventsDots();
	}

	#sliderEventsArrow() {
		SliderButtonRight.addEventListener('click', () => nextSlide());
		SliderButtonLeft.addEventListener('click', () => previousSlide());
	}

	#sliderEventKeys(){
		document.addEventListener('keydown',function(e){
			e.key=='ArrowLeft' && previousSlide();
			e.key=='ArrowRight' && nextSlide();
		})
	}

	#sliderEventsDots() {
		DotContainer.addEventListener('click',function(e){
			const {slide} = e.target.dataset;
			setActiveDot(Number(slide));
			Slide(Number(slide));
		})
	}

	/* TRANSITION AND STYLES */

	showNextSlides() {
		this.slideTransition('right');
	}

	showPrevSlides() {
		this.slideTransition('left');
	}

	async slideTransition(direction = 'right') {
		try{
			this.setClassesAndStyles();
			this.setAllIndexes(false, direction);
		}
		catch(err){
			console.error(err);
			new Error('Slider not showing next image');
		}
		finally{
			let lastSlide = this.checkForCurIndex();
			if (this.opts.loop || (!lastSlide)) {
				this.interval = await SliderHelpers.loop(this.opts.delay);
				await this.slideTransition();
			}
		}
	}

	setClassesAndStyles() {
		console.log('setClassesAndStyles');
		this.deleteClasses();
		this.addToClassList(this.curIndex,this.curElementClass);
		this.addToClassList(this.lastIndex,this.prevElementClass);
		this.setTransitionStyles();
	}

	addToClassList(indexArr,cssClass) {
		indexArr.forEach((el) => this.sliderElements[el].classList.add(cssClass));
	}

	deleteClasses() {
		this.sliderElements.forEach((el) => el.classList.remove(this.curElementClass,this.prevElementClass));
	}

	setTransitionStyles() {
		switch (this.opts.transition) {
			case 'fade':
				this.setTransitionStylesFade();
				break;
			case 'fade':
				this.setTransitionStylesTranslate();
				break;
			default:
				this.setTransitionStylesFade();
				break;
		}
	}

	setTransitionStyle(indexArr, styleProp, styleVal) {
		indexArr === '*' && this.sliderElements.forEach((el) => SliderHelpers.setElStyle(el,styleProp,styleVal));
		indexArr !== '*' && indexArr.forEach((el) => SliderHelpers.setElStyle(this.sliderElements[el],styleProp,styleVal));
	}

	setTransitionStylesFade() {
		this.setTransitionStyle(this.othIndex,'opacity','0');
		this.setTransitionStyle(this.curIndex,'opacity','1');
		this.setTransitionStyle(this.lastIndex,'opacity','0');
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
		this.wrapper = SliderHelpers.wrapAround(this.allSliderElements,SliderHelpers.createWrapperElement(this.#opts.sliderWrapperClass));
		this.container.innerHTML = '';
		this.container.insertAdjacentElement('afterbegin',this.wrapper);
		this.wrapperDomElement = document.querySelector(`.${this.#opts.sliderWrapperClass}`);
		this.setWrapperHeight();
	}

	getImagesForWrapperMaxHeight(){
		if ([...this.allSliderElements].filter(el => el.nodeName==='DIV').length){
			return [...this.allSliderElements].filter(el => el.nodeName==='DIV').map(el => el.childNodes[0]);
		}
		else
			return [...this.allSliderElements];
	}

	async setWrapperHeight(el) {
		this.getWrapperMaxHeight().then((res) => this.wrapper.style.maxHeight = `${res}px`);
	}

	async getWrapperMaxHeight() {
		try {
			let imagesTarget = this.getImagesForWrapperMaxHeight();
			let sliderElementsHeights = await Promise.all(imagesTarget.map(async (el,index) => {
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
	#sliderContainer;
	#elementWrapper = false;
	#elementIsWrapped = false;
	elementWrapperClass = 'slider-image-wrapper'
	childnode;
	#opts;
	#index;

	constructor(
		options,
		sliderContainer,
		element,
		index
	){
		for (const option of Object.entries(options)) {
			this.#opts = options;
		}
		this.#sliderContainer = sliderContainer;
		this.childnode 				= element;
		this.#index 					= index;
		this.init();
	}

	init() {
		this.setElementIsWrapped() && this.setElementWrapper();
		this.setElementStyles(this.childnode);
		this.addElementClassesFromOptions('type','gallery','parallel');
		this.addElementClassesFromOptions('zoomOnHover',true,'zoom');
		this.addElementToContainer(this.childnode);
	}

	setElementIsWrapped(){
		return this.#elementIsWrapped = (this.#opts.vignette || this.#opts.zoomOnHover) && true;
	}

	setElementWrapper() {
		console.log(this.childnode);
		this.childnode = SliderHelpers.wrapAround(this.childnode,SliderHelpers.createWrapperElement(this.elementWrapperClass));
		console.log(this.childnode);
		this.#sliderContainer.innerHTML = '';
		this.#sliderContainer.insertAdjacentElement('afterbegin',this.childnode);
	}

	setElementStyles(el) {
		let curColumn = this.#opts.slidesRowWrap ? 
										(this.#index+1)%this.#opts.slidesPerRow : 
										(this.#index+1);
		SliderHelpers.setElStyle(el,'gridRowStart',1);
		(curColumn === 0)
			?SliderHelpers.setElStyle(el,'gridColumnStart',this.#opts.slidesPerRow)
			:SliderHelpers.setElStyle(el,'gridColumnStart',curColumn);
	}

	addElementClassesFromOptions(optionName,optionValue,cssClass) {
		(this.#opts[optionName] == optionValue) && SliderHelpers.setElClass(this.childnode,cssClass);
	}

	addElementToContainer(el) {
		SliderHelpers.setElClass(this.#elementIsWrapped?el.children[0]:el,'slider-image');
		//this.#sliderContainer.insertAdjacentElement('beforeend', el);
	}
}

const slider1 = new Slider(
	{
		delay: 5,
		margin: 10,
		sliderClass: 'slider',
		slidesPerRow: 3,
		slidesRowWrap: true,
		type:'slider', 
		vignette: true,
		zoomOnHover: true
	},
	'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg','Public/Images/img-4.jpg','Public/Images/img-5.jpg','Public/Images/img-6.jpg'
);