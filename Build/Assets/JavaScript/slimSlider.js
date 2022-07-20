'use strict';

require("../Scss/slimSlider.scss");

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
		sliderClass:"slider",
		sliderWrapperClass: "slider-wrapper",
		type: 'slider',
		loop: true, 
		autoplay: true,
		delay: 6,
		transition: 'fade',
		transitionTiming: 'linear',
		slidesOnScreen: 1,
		marginImage: 0
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
		this.opts = this.options;
		this.images = images;
		this.imgCount = images.length;
		this.lastInd = this.imgCount-1;
		this.loop && (this.interval = '');
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

	wait (sec) {
		return new Promise((res) => {setTimeout(res, sec * 1000)});
	}

	loop() {
		return new Promise((res) => {this.interval = setInterval(res, this.opts.delay * 1000)})
	}

	clearLoop() {
		clearInterval(this.interval);
	}

	setSliderClasses(){
		this.sliderElements.forEach((el,ind) => {
			el.classList.remove(this.curElementClass,this.prevElementClass);
		});
		this.sliderElements[this.imgCurIndex].classList.add('cur-image');
		this.sliderElements[this.lastInd].classList.add(this.prevElementClass);
	}

	showNextSlide() {
		this.setSliderClasses();
	}

	async slideTransition() {
		try{
			this.showNextSlide();
		}
		catch(err){
			console.error(err);
			new Error('Slider not showing new image');
		}
		finally{
			//console.log(this.opts.loop);
			let lastSlide = (this.imgCurIndex+1) === this.imgCount;
			if (this.opts.loop || (!lastSlide)){
				await this.loop();
				this.lastInd = this.imgCurIndex;
				lastSlide ? this.imgCurIndex=0 : this.imgCurIndex++;
				await this.slideTransition();
			}
		}
	}

	getCssTransitionProp(){
		try{
			return this.transitions[this.opts.transition];
		}
		catch(err){
			new Error('Transition not found');
		}
	}

	setContainerStyles(){
		this.#sliderContainer.style.gridTemplateColumns = `${this.opts.slidesOnScreen}fr`;
		this.#sliderContainer.style.transitionProperty 	= this.getCssTransitionProp();
	}

	wrap(el, wrapper) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
	}

	async createSlider() {
		try{
			this.setContainerStyles();
			this.createSliderElements();
			if (this.opts.slidesOnScreen > 1){
				let sliderWrapper = new SliderWrapper(this.opts,this.sliderElements);
				this.#sliderContainer.innerHTML = '';
				this.#sliderContainer.insertAdjacentElement('afterbegin',sliderWrapper.wrapper);
			}
		}
		catch(err){
			console.log(err);
			new Error('Slider not created');
		}
	}

	createSliderElements(){
		this.images.length && this.deleteImages();
		this.imgsLoaded.forEach((el,slideIndex) => {
			let sliderElement = new SliderElement(this.opts,el);
			this.sliderElements.push(sliderElement.childnode);
			this.addImageToContainer(sliderElement.childnode);
		});
		console.log(this.sliderElements);
	}

	async addImageToContainer (el) {
		this.opts.type=='gallery' && el.classList.add('parallel');
		this.#sliderContainer.insertAdjacentElement('beforeend', el);
	}

	async createImage(path) {
		return new Promise(function(res,rej){
			let image = document.createElement('img');
			image.src = path;
			image.addEventListener('load', () => res(image), false);
			image.addEventListener('error', () => rej(new Error(`Failed to load img > ${image.src}`)), false);
		});
	}

	async loadSingleImage (path) {
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

	async #loadAllImages () {
		try{
			if (!this.imgsLoaded){
				return await Promise.all(this.images.map(async image => this.loadSingleImage(image)));
			}		
		}catch(error){
			new Error(`image loading failed `); 
		}
	};
}

class SliderWrapper{
	wrapper;
	allSliderElements;
	#opts;

	constructor(options, allSliderElements){
		this.#opts = options;
		this.allSliderElements = allSliderElements;
		this.wrapper = this.createWrapper();
		this.setWrapperHeight(this.wrapper);
	}

	createWrapper(){
		let wrapper = document.createElement('div');
		wrapper.classList.add(this.#opts.sliderWrapperClass);
		wrapper.innerHTML = this.allSliderElements; 
		return wrapper;
	}

	getWrapperMaxHeight(){
		let sliderElementsHeights = [...allSliderElement].map(el => Number(el.height));
		return Math.min(...sliderElementsHeights);
	}

	setWrapperHeight(el){
		el.style.maxHeight = this.#opts.transition!=='fade'?`${this.getElementsMaxHeight()}px`:this.elementsHeights;
	}
}

class SliderElement {
	childnode;
	opts;

	constructor(
		options,
		sliderElement
	){
		for (const option of Object.entries(options)){
			this.opts = options;
		}
		this.childnode = sliderElement;
		this.setElementStyles(this.childnode);
	}

	setElementDimensions(el){
		el.style.maxWidth = `${100/this.opts.slidesOnScreen}%`;
	}

	setElementStyles(el){
		el.style.margin = this.opts.marginImage;
		el.style.gridRowStart	= 1;
		el.style.gridColumnStart = 1;
		this.setElementDimensions(el);
	}
}

const slider1 = new Slider(
	{
		type:'slider',
		sliderClass: 'slider'
	},
	'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg'
);