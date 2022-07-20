'use strict';

require("../Scss/slimSlider.scss");

class Slider {
	#sliderContainer;
	#sliderElements;
	imgsLoaded = false;
	
	imgCurIndex = 0;
	lastInd;
	imgCount = 0;
	curElementClass = 'cur-image';
	prevElementClass = 'prev-image';
	sliderElementsHeights = '100vh';

	opts;
	options = {
		sliderClass:".slider",
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
		this.opts 								= this.options;
		this.images 							= images;
		this.imgCount 						= images.length;
		this.lastInd							= this.imgCount-1;
		this.loop && (this.interval = '');
		this.init();
	}

	async init() {
		try{
			this.#sliderContainer 	= document.querySelector(this.opts.sliderClass);
			this.imgsLoaded 		 		= await this.loadAllImages(this.opts);
		}
		catch(err){
			console.error(err);
			throw new Error('Slider initialising failed');
		}
		finally{
			this.images.length && this.addToImageContainer();
			//console.log(this.#sliderContainer);
			this.#sliderElements = this.#sliderContainer.childNodes;
			this.opts.type=='slider' && this.createSlider();
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

	hideAllSlides() {
		this.#sliderElements.forEach((el,ind) => {
			el.classList.remove(this.curElementClass,this.prevElementClass);
			this.#sliderElements[this.lastInd].classList.add(this.prevElementClass);
			// if (ind !== this.imgCurIndex && ind !== this.lastInd){
			// 	el.style.display = 'none';
			// }
		});
	}

	showNextSlide() {
		console.log(this.#sliderElements);
		let curSlide = this.#sliderElements[this.imgCurIndex];
		curSlide.classList.add('cur-image');
		//curSlide.style.display = 'block';
	}

	async slideTransition() {
		try{
			this.hideAllSlides();
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

	async createSlider() {
		try{
			this.setContainerStyles();
			this.#sliderElements.forEach((el) => {
				new SliderElement(el);
			});
			await this.slideTransition();
		}
		catch(err){
			console.log(err);
			new Error('Slider not created');
		}
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

	async addToImageContainer () {
		this.deleteImages();
		for(const loadedImg of this.imgsLoaded){
			this.opts.type=='gallery' && loadedImg.classList.add('parallel');
			this.#sliderContainer.insertAdjacentElement('beforeend', loadedImg);
		};
	}

	async loadAllImages () {
		try{
			if (!this.imgsLoaded){
				return await Promise.all(this.images.map(async image => this.loadSingleImage(image)));
			}		
		}catch(error){
			new Error(`image loading failed `); 
		}
	};
}

class SliderElement extends Slider {
	#sliderElement;

	constructor(options,images,sliderElement){
		super (options, images);
		this.#sliderElement = sliderElement;
	}

	init(){
		console.log('Init Sliderelement');
		this.setElementStyles();
	}

	getElementsMaxHeight(){
		console.log(this.#sliderElement);
		let sliderElementsHeights = [...images].map(el => Number(el.height));
		return Math.min(...sliderElementsHeights);
	}

	setElementDimensions(el){
		el.style.maxWidth = `${100/this.opts.slidesOnScreen}%`;
		el.style.maxHeight = this.opts.transition!=='fade'?`${this.getElementsMaxHeight()}px`:this.elementsHeights;
	}

	setElementStyles(){
		el.style.margin = this.opts.marginImage;
		el.style.gridRowStart	= 1;
		el.style.gridColumnStart = 1;
		this.setElementDimensions(this.#sliderElement);
	}
}

const slider1 = new Slider(
	{
		type:'slider',
		sliderClass: '.slider'
	},
	'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg'
);