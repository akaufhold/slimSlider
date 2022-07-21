'use strict';

require("../Scss/slimSlider.scss");

class SliderHelpers {
	sec;

	constructor(sec){
		this.sec = sec;
	}

	static wait (sec) {
		return new Promise((res) => {setTimeout(res, sec * 1000)});
	}

	static loop(sec) {
		return new Promise((res) => {this.interval = setInterval(res, sec * 1000)})
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
			//console.log(this.#sliderContainer);
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

	setContainerStyles(el){
		let gridTemplateColumnsString = '';
		el.style.display = 'grid';
		el.style.justifyContent = 'center';
		for (let i=0; i<this.opts.slidesOnScreen; i++){
			gridTemplateColumnsString += `1fr ${this.opts.marginImage!==0?this.opts.marginImage:''}`;
		}
		el.style.gridTemplateColumns = `${gridTemplateColumnsString.slice(0,-1)}`;
		el.style.transitionProperty 	= this.getCssTransitionProp();
	}

	createSlider() {
		try{
			let parentStyles = this.#sliderContainer;
			console.log(parentStyles);
			this.createSliderElements();
			if (this.opts.slidesOnScreen > 1){
				this.createWrapper();
				this.wait(0.2);
				this.#sliderWrapper = parentStyles = document.querySelector(`.${this.opts.sliderWrapperClass}`);
			}
			console.log(parentStyles);
			this.setContainerStyles(parentStyles);
		}
		catch(err){
			console.log(err);
			new Error('Slider not created');
		}
	}

	createWrapper(){
		let sliderWrapper = new SliderWrapper(this.opts,this.sliderElements);
		this.#sliderContainer.innerHTML = '';
		this.#sliderContainer.insertAdjacentElement('afterbegin',sliderWrapper.wrapper);
	}

	createSliderElements(){
		this.images.length && this.deleteImages();
		this.imgsLoaded.forEach((el,index) => {
			let sliderElement = new SliderElement(this.opts,el,index);
			this.sliderElements.push(sliderElement.childnode);
			this.addImageToContainer(sliderElement.childnode);
		});
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
		this.wrapper = this.wrap(this.allSliderElements,this.wrapper);
		this.init();
		console.log("test",this.wrapper);
	}

	init(){
		this.setWrapperHeight(this.wrapper);
	}

	wrap (el, wrapper) {
			el.forEach(el => wrapper.appendChild(el));
			return wrapper;
	}

	createWrapper(){
		let wrapper = document.createElement('div');
		wrapper.classList.add(this.#opts.sliderWrapperClass);
		return wrapper;
	}

	getWrapperMaxHeight(){
		let sliderElementsHeights = [...this.allSliderElements].map(el => {
			console.log(el.clientHeight);
			return Number(el.height);
		});
		return Math.min(...sliderElementsHeights);
	}

	setWrapperHeight(el){
		let wrapperMaxHeight = this.#opts.transition!=='fade'?`${this.getWrapperMaxHeight()}px`:this.elementsHeights;
		el.style.maxHeight = wrapperMaxHeight;
	}
}

class SliderElement {
	childnode;
	opts;
	index;

	constructor(
		options,
		sliderElement,
		index
	){
		for (const option of Object.entries(options)){
			this.opts = options;
		}
		this.index = index;
		this.childnode = sliderElement;
		this.setElementStyles(this.childnode);
	}

	setElementStyles(el){
		let curColumn = (this.index+1)%this.opts.slidesOnScreen;
		el.style.gridRowStart	= 1;
		el.style.gridColumnStart = `${(curColumn===0)?this.opts.slidesOnScreen:curColumn}`;
	}
}

const slider1 = new Slider(
	{
		type:'slider',
		sliderClass: 'slider',
		slidesOnScreen: 3
	},
	'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg','Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg'
);