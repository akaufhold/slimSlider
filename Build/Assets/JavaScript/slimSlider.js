'use strict';

require("../Scss/slimSlider.scss");

class SliderHelpers {
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
	/* DOM ELEMENTS */
	#sliderContainer;
	#sliderWrapper = false;
	sliderElements = [];
	imgsLoaded = false;
	
	/* CONTROLS */
	sliderControls;

	/* INDEXES, IMAGES LENGTH AND INCREMENT */
	imgCount = 0;
	curIndex = [0];
	lastIndex;
	othIndex;
	incIndex = 1;
	interval;

	/* OTHER DEFAULTS */
	curElementClass = 'cur-element';
	prevElementClass = 'prev-element';
	sliderElementsHeights = '100vh';

	/* OPTIONS */
	opts;
	options = {
		autoplay: true,
		controls: {
			arrows: true,
			dots: true,
			events: true
		},
		delay: 6,
		loop: true, 
		margin: 0,
		slidesPerRow: 1,
		slidesPerColumn: 1,
		slidesRowWrap: false,
		sliderClass:"slider",
		sliderWrapperClass: "slider-wrapper",
		elementWrapperClass:'slider-image-wrapper',
		elementClass:'slider-image',
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
			this.opts.controls!== false && this.#addControls();
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
			this.sliderElements.push(sliderElement.elementIsWrapped ? sliderElement.elementWrapper : sliderElement.elementnode);
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

	/* CREATE SLIDER CONTROL ELEMENTS */
	
	#addControls() {
		this.sliderControls = new SliderControls(this.opts,this.#sliderContainer,this.#sliderWrapper,this.sliderElements);
		console.log(this.sliderControls);
		this.opts.controls.events && this.#addControlEvents();
	}

	#addControlEvents() {
		this.opts.controls.arrows && this.#controlEventsArrow();
		this.opts.controls.dots && this.#controlEventsDots();
		this.opts.controls.events && this.#controlEventKeys();
	}

	#controlEventsArrow() {
		this.sliderControls.arrowContainer.sliderButtonLeft.addEventListener('click', () => this.showPrevSlides());
		this.sliderControls.arrowContainer.sliderButtonRight.addEventListener('click', () => this.showNextSlides());
	}

	#controlEventKeys() {	
		document.addEventListener('keydown',function(e){
			console.log(e);
			e.key=='ArrowLeft' && this.showPrevSlides();
			e.key=='ArrowRight' && this.showNextSlides();
		}.bind(this))
	}

	#controlEventsDots() {
		this.sliderControls.dotContainer.addEventListener('click',function(e){
			const {slide} = e.target.dataset;
			//console.log(e.target.dataset);
			//this.setActiveDot(Number(slide));
			this.showSlides(Number(slide));
		}.bind(this), false);
	}

	/* SETS AND CHECK INDEXES FOR CURRENT, LAST AND OTHER ELEMENTS */

	setIndexIncrement() {
		this.incIndex = this.getIndexesArray('slidesPerRow',true).length;
	}

	setAllIndexes(start = false, target='right') {
		this.setLastIndexes(start);
		this.setCurrentIndexes(start, target);
		this.setOtherIndexes(this.curIndex,this.lastIndex);
	}

	getIndexesArray(prop, opts = false) {
		let arrayTo = opts?this.opts[prop]:this[prop];
		return [...Array(arrayTo).keys()];
	}

	setLastIndexes(start = false) {
		if (start){
			let lastSliceIndex =  this.incIndex * -1;
			this.lastIndex = this.getIndexesArray('imgCount').splice(lastSliceIndex);
		} else {
			this.lastIndex = this.curIndex;
		}
	}

	setCurrentIndexes(start = false, target) {
		let initialIndexes = this.getIndexesArray('slidesPerRow',true);
		//console.log('initial', initialIndexes);
		if (start || this.checkForCurIndex()) {
			this.curIndex = initialIndexes;
			//console.log('start', this.curIndex);
		} else{
			console.log(target, this.curIndex);
			this.curIndex = this.curIndex.map((value,index) => {
				if (target==='right')
					return value + this.incIndex;
				else if (target==='left')
					return value - this.incIndex;
				else
					return this.getCorrectIndexForTarget(target) + index;
			});
		}
	}

	getCorrectIndexForTarget(target) {
		let arrImageCount = this.getIndexesArray('imgCount').length;
		let newIndex = this.opts.slidesPerRow * Math.floor(target/this.opts.slidesPerRow);
		return newIndex;
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

	/* TRANSITION AND STYLES */

	showSlides(index) {
		this.slideTransition(false, index);
	}

	showNextSlides() {
		this.slideTransition(false, 'right');
	}

	showPrevSlides() {
		this.slideTransition(false, 'left');
	}

	async slideTransition(start = true, target = 'right') {
		try{
			!start && this.setAllIndexes(false, target);
			!start && this.sliderControls.setActiveDot(this.curIndex);
			this.setClassesAndStyles();
		}
		catch(err){
			console.error(err);
			new Error('Slider not showing next image');
		}
		finally{
			let lastSlide = this.checkForCurIndex();
			if (this.opts.loop || (!lastSlide)) {
				this.interval = await SliderHelpers.loop(this.opts.delay);
				await this.slideTransition(false);
			}
		}
	}

	setClassesAndStyles() {
		//console.log('setClassesAndStyles');
		this.deleteClasses();
		//console.log(this.lastIndex,this.curIndex);
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

	/*Slide (cur) {
		SingleSlides.forEach((slide,index) => slide.style.transform = `translateX(${(index-cur)*100}%)`);
	}*/


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

	async getWrapperMaxHeight() {
		try {
			let imagesTarget = this.getImagesForWrapperMaxHeight();
			let sliderElementsHeights = await Promise.all(imagesTarget.map(async (el,index) => {
				await SliderHelpers.waitForElement(`.${this.#opts.sliderWrapperClass}`,0);
				console.log(parseInt(window.getComputedStyle(el).height));
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
	elementWrapper = false;
	elementIsWrapped = false;
	elementnode;
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
		this.elementnode 			= element;
		this.#index 					= index;
		this.init();
		//console.log(this.#sliderContainer);
	}

	init() {
		this.isElementWrapped() && this.setElementWrapper();
		this.setElementStyles(this.elementWrapper?this.elementWrapper:this.elementnode);
		this.addElementClassesFromOptions('type','gallery','parallel');
		this.addElementClassesFromOptions('zoomOnHover',true,'zoom');
		SliderHelpers.setElClass(this.elementnode,this.#opts.elementClass);
	}

	isElementWrapped(){
		return this.elementIsWrapped = (this.#opts.vignette || this.#opts.zoomOnHover) && true;
	}

	setElementWrapper() {
		this.#index===0 && (this.#sliderContainer.innerHTML = '');
		this.elementWrapper = SliderHelpers.wrapAround(
			this.elementnode,
			SliderHelpers.createWrapperElement(this.#opts.elementWrapperClass)
		);
		this.#sliderContainer.insertAdjacentElement('beforeEnd',this.elementWrapper);
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
		(this.#opts[optionName] == optionValue) && SliderHelpers.setElClass(this.elementnode,cssClass);
	}
}

class SliderControls {
	#sliderContainer;
	#sliderWrapper;
	#sliderElements;

	controlContainer = false;
	dotContainer = false;
	arrowContainer = false;

	#controlCssClasses = {
		container: {
			name: 'slider-controls',
			dotContainer: {
				name: 'slider-control-dots',
				dot: {
					name: 'slider-control-dot'
				}
			},
			arrowContainer: {
				name: 'slider-control-arrows',
				arrow: {
					name: 'slider-control-arrow'
				}
			}
		}
	};	

	#opts;

	constructor(
		options,
		sliderContainer,
		sliderWrapper,
		sliderElements
	){
		for (const option of Object.entries(options)) {
			this.#opts = options;
		}
		this.#sliderContainer = sliderContainer;
		this.#sliderWrapper   = sliderWrapper;
		this.#sliderElements 	= sliderElements;
		this.init();
		//console.log(this.#sliderContainer);
	}

	init() {
		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add(this.#controlCssClasses.container.name);
		this.#opts.controls.dots && this.#addControlDots();
		this.#opts.controls.arrows && this.#addControlArrows();

		this.#sliderWrapper ?
			this.#sliderWrapper.appendChild(this.controlContainer):
			this.#sliderContainer.appendChild(this.controlContainer);

		this.#opts.slidesRowWrap ? this.setActiveDot([...Array(this.#opts.slidesPerRow).keys()]) : this.setActiveDot([0]);
	}

	#addControlDots() {
		this.dotContainer = document.createElement('div');
		this.dotContainer.classList.add(this.#controlCssClasses.container.dotContainer.name);
		this.#sliderElements.forEach((_,index) => {
			this.dotContainer.insertAdjacentHTML('beforeEnd',`<div class="${this.#controlCssClasses.container.dotContainer.dot.name}" data-slide="${index}"></div>`);
		});
		this.controlContainer.appendChild(this.dotContainer);
	}

	#addControlArrows() {
		this.arrowContainer = {}
		this.arrowContainer.wrapper = document.createElement('div');
		this.arrowContainer.wrapper.classList.add(this.#controlCssClasses.container.arrowContainer.name);
		this.arrowContainer.sliderButtonLeft = this.#addControlArrowsSingle('left');
		this.arrowContainer.sliderButtonRight = this.#addControlArrowsSingle('right');
		this.controlContainer.appendChild(this.arrowContainer.wrapper);
	}

	#addControlArrowsSingle(direction){
		let arrow = document.createElement('div');
		arrow.classList.add(`${this.#controlCssClasses.container.arrowContainer.arrow.name}-${direction}`);
		this.arrowContainer.wrapper.appendChild(arrow);
		return arrow;
	}

	resetDots(){
		SliderHelpers.clearInterval();
		//console.log(this.#controlCssClasses.container.dotContainer.dot.name);
		this.dotContainer.querySelectorAll(`.${this.#controlCssClasses.container.dotContainer.dot.name}`).forEach((el,index) => {
			el.classList.remove('dot-active');
		});
	}

	setActiveDot(slide) {
		//console.log(slide);
		this.resetDots();
		slide.forEach(el => {
			document.querySelector(`.${this.#controlCssClasses.container.dotContainer.dot.name}[data-slide="${el}"]`).classList.add('dot-active')
		})
	}
}

const slider1 = new Slider(
	{
		delay: 5,
		margin: 0,
		sliderClass: 'slider',
		slidesPerRow: 3,
		slidesRowWrap: false,
		type:'slider', 
		vignette: true,
		zoomOnHover: true
	},
	'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg','Public/Images/img-4.jpg','Public/Images/img-5.jpg','Public/Images/img-6.jpg'
);

// let index = 0;
// var interval = setInterval(function(){
// 	console.log('interval => index',index);
// 	index++;
// },1000)
// setTimeout(function(){
// 	clearInterval(interval);
// },6000)