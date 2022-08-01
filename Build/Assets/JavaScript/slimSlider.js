'use strict';

import '../Scss/slimSlider.scss';

import SliderHelpers from './slimSlider.helpers';
import SliderControls from './slimSlider.controls';
import SliderWrapper from './slimSlider.wrapper';
import SliderElement from './slimSlider.element';

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
			dotsCount: 'fitRows', /* fitRows or all/empty */
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
		elementType:'picture',
		transition: 'fade', /* fade, slide or rotate */
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
			this.opts.type === 'slider' && this.createSlider();
			this.opts.controls!== false && this.#addControls();
			await this.slideTransition('right');
		}
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
		this.setCssTransitionProp(el);
	}

	setCssTransitionProp(el,addProp='') {
		el.style.transitionProperty = `${this.getCssTransitionProp()}${addProp && ','+addProp}`;
	}

	setCssTransitionTiming(el,prop) {
		el.style.transitionTiming = `${prop}`;
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
		if (this.opts.slidesRowWrap){
			let gridTemplateColumnsString = '';
			for (let i=0; i<this.opts.slidesPerRow; i++){
				gridTemplateColumnsString += `1fr `;
			}
			return `${gridTemplateColumnsString.slice(0,-1)}`;
		}
		else {
			return 'repeat(auto-fit, minmax(300px, 1fr))';
		}
	}

	/* CREATE SLIDER CONTROL ELEMENTS */
	
	#addControls() {
		this.sliderControls = new SliderControls(this.opts,this.#sliderContainer,this.#sliderWrapper,this.sliderElements);
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
			e.key==='ArrowLeft' && this.showPrevSlides();
			e.key==='ArrowRight' && this.showNextSlides();
		}.bind(this))
	}

	#controlEventsDots() {
		this.sliderControls.dotContainer.addEventListener('click',function(e){
			const {slide} = e.target.dataset;
			Number.isInteger(parseInt(slide)) && this.showSlides(Number(slide));
		}.bind(this), false);
	}

	/* SETS AND CHECK INDEXES FOR CURRENT, LAST AND OTHER ELEMENTS */

	setIndexIncrement() {
		this.incIndex = this.opts.slidesPerRow;
	}

	setAllIndexes(start = false, target='right') {
		this.setLastIndexes(start);
		this.setCurrentIndexes(start, target);
		this.setOtherIndexes(this.curIndex,this.lastIndex);
	}

	setLastIndexes(start = false) {
		if (start){
			const lastSliceIndex =  this.incIndex * -1;
			this.lastIndex = this.getIndexesArrayForProp('imgCount').splice(lastSliceIndex);
		} else {
			this.lastIndex = this.curIndex;
		}
	}

	setCurrentIndexes(start = false, target) {
		const initialIndexes = this.setInitialIndex(target);
		if (start || this.checkForLastIndex(target)) {
			this.curIndex = initialIndexes;
		} else if (this.checkForFirstIndex(target)) {
			this.curIndex = this.getIndexesArrayForProp('imgCount').splice(this.incIndex * -1);
		} else{
			this.curIndex = this.curIndex.map((value, index) => {
				return this.setIncrementedIndex(target, value, index);
			});
		}
	}

	setIncrementedIndex(target, value, index) {
		if (target==='right')
			return value + this.incIndex;
		else if (target==='left')
			return value - this.incIndex;
		else {
			const targetIndex = this.opts.controls.dotsCount==='fitRows'?
				(target*this.opts.slidesPerRow)+ index:
				this.getCurrentIndexForTarget(target) + index;
			return targetIndex;
		}
	}

	setInitialIndex(target) {
		return this.getIndexesArrayForProp('slidesPerRow',true, target);
	}

	getIndexesArrayForProp(prop, opts = false, target='right') {
		const arrayTo = opts?this.opts[prop]:this[prop];
		if (Number.isInteger(arrayTo)){
			const arrayInitial = target==='left'?[...Array(arrayTo).keys()]:[...Array(arrayTo).keys()];
			return arrayInitial;
		}
		else throw new Error(`An error occured for the 'prop' parameter with value ${prop}. It's not existing in constant declaration.`);
	}

	checkForLastIndex(target='right') {
		if (target==='left') return;
		if (target==='right')
			return this.curIndex.includes(this.imgCount-1);
		else if (Number.isInteger(target)) return this.curIndex.includes(this.getDotIndexFitRows(target));
		else throw new Error (`An error occured for parameter "target" with value ${target}. It should be either an integer index number of the next slide or direction 'left' or 'right'`);
	}

	checkForFirstIndex(target='left') {
		if (target==='left') 
			return this.curIndex.includes(0);
		else return false;
	}

	checkIndexSelectedAlready(target) {
		const index = this.getDotIndexFitRows(target);
		return this.curIndex.includes(index);
	}

	getDotIndexFitRows(target){
		return this.opts.controls.dotsCount==='fitRows'?target*this.incIndex:target
	}
	
	getCurrentIndexForTarget(target) {
		const newIndex = this.incIndex * Math.floor(target/this.incIndex);
		return newIndex;
	}

	setOtherIndexes(curIndex,lastIndex) {
		this.othIndex = this.getIndexesArrayForProp('imgCount').filter(el => {
			const checkLast = curIndex.includes(el);
			const checkCurs = lastIndex.includes(el);
			return (!checkLast && !checkCurs);
		});
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
			let isSelected = this.checkIndexSelectedAlready(target);
			if (!start && !isSelected){
				this.setAllIndexes(false, target);
				this.sliderControls.setActiveDot(this.curIndex);
			}
			!isSelected && this.setClassesAndStyles();
		}
		catch(err){
			console.error(err);
			new Error('Slider not showing next image');
		}
		finally{
			let lastSlide = this.checkForLastIndex();
			if (this.opts.loop || (!lastSlide)) {
				this.interval = await SliderHelpers.loop(this.opts.delay);
				await this.slideTransition(false);
			}
		}
	}

	setClassesAndStyles() {
		this.removeClassesFromElementArr(this.sliderElements);
		this.addClassToElementArr(this.curIndex,this.curElementClass);
		this.addClassToElementArr(this.lastIndex,this.prevElementClass);
		this.setTransitionStyles();
	}

	addClassToElementArr(indexArr,cssClass) {
		indexArr.forEach((el) => this.sliderElements[el].classList.add(cssClass));
	}

	removeClassesFromElementArr(obj) {
		obj.forEach((el) => el.classList.remove(this.curElementClass,this.prevElementClass));
	}

	setTransitionStyles() {
		let transitionTraget = this.#sliderWrapper?this.#sliderWrapper:this.#sliderContainer;
		switch (this.opts.transition) {
			case 'fade':
				this.setTransitionStylesFade();
				break;
			case 'slide':
				if (!this.opts.slidesRowWrap) {
					this.setCssTransitionProp(transitionTraget,'transform');
					this.setTranslateForWrapper();
				} else this.setTranslateForElements();
				break;
			default:
				this.setTransitionStylesFade();
				break;
		}
	}

	setTransitionStylesFade() {
		if (!this.opts.slidesRowWrap) {
			this.setCssTransitionProp(transitionTraget,'transform');
			this.setTranslateForWrapper();
		}
		this.setStyleForElements(this.othIndex,'opacity','0');
		this.setStyleForElements(this.curIndex,'opacity','1');
		this.setStyleForElements(this.lastIndex,'opacity','0');
	}

	setTranslateForWrapper() {
		this.#sliderWrapper.style.transform = `translate3d(-${(100/this.sliderElements.length)*this.curIndex[0]}%,0,0)`;
	}

	setStyleForElements(indexArr, styleProp, styleVal) {
		//console.log(indexArr, styleProp, styleVal);
		indexArr === '*' && this.sliderElements.forEach((el) => SliderHelpers.setElStyle(el,styleProp,styleVal));
		indexArr !== '*' && indexArr.forEach((el) => SliderHelpers.setElStyle(this.sliderElements[el],styleProp,styleVal));
	}

	setTranslateForElements() {
		this.sliderElements.forEach((el,ind) => {
			this.setCssTransitionProp(el);
			this.setCssTransitionTiming(el,this.opts.transitionTiming);
			let translateX = SliderHelpers.isEven(ind)?'-100%':'100%';
			this.setStyleForElements([ind],'transform',`translate3d(${translateX},0,0)`);
		});
		this.resetTranslateForElements();
	}

	resetTranslateForElements(){
		let targetElements = this.sliderElements.filter((el,index) => {
			if (this.curIndex.includes(index)){
				el.originalIndex = index;
				return true;
			}
		});
		targetElements.forEach((el,ind) => {
			this.setStyleForElements([el.originalIndex],'transform',`translate3d(0,0,0)`);
		});
	}
}

const slider1 = new Slider(
	{
		delay: 50,
		controls: {
			arrows: true,
			dots: true,
			dotsCount: 'fitRows', /* fitRows or all/empty */
			events: true
		},
		elementType: 'div',
		loop: true,
		margin: 0,
		sliderClass: 'slider',
		slidesPerRow: 3,
		slidesRowWrap: true,
		transition: 'slide',
		transitionTiming: 'ease-in-out',
		type:'slider', 
		vignette: true,
		zoomOnHover: false
	},
	'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg','Public/Images/img-4.jpg','Public/Images/img-5.jpg','Public/Images/img-6.jpg'
);