'use strict';

//import GLTransitions from "gl-transitions";

// IMPORT SCSS
import '../Scss/slimSlider.scss';

// IMPORT JS CLASSES
import SliderHelpers from './slimSlider.helpers';
import SliderWrapper from './slimSlider.wrapper';
import SliderElement from './slimSlider.element';
import SliderUI from './slimSlider.ui';
import SliderLoader from "./slimSlider.loader";
import SliderResponsive from "./slimSlider.responsive";

// IMPORT JS VARS
import {options as SliderOptions, transitions as SliderTransition} from "./slimSlider.options";

export default class Slider {
	/* DOM ELEMENTS */
	#sliderContainer;
	sliderWrapper = false;
	sliderElements = [];
	imgsLoaded = false;
	
	/* USER INTERFACE */
	sliderUI;

	/* INDEXES, IMAGES COUNT, INCREMENT AND INTERVAL */
	imgCount = 0;
	curIndex = [0];
	lastIndex;
	othIndex;
	incIndex = 1;
	interval;

	/* TOUCH EVENT POSITIONS AND FUNCTIONS */
	posX1 = 0;
	posX2 = 0;
	posY1 = 0;
	posY2 = 0;
  posInitial;
	posFinal;
	dragEnd;
	dragAction;
	dragAxis = 'X';
	transitionTarget;
	transitionDefault; 

	/* DEFAULT CSS CLASSES  */
	curElementClass = 'cur-element';
	prevElementClass = 'prev-element';

	/* STYLE DEFAULTS */
	sliderElementsHeights = '100vh';

	/* OPTIONS */
	opts;

	/* IMPORTS */
	options = SliderOptions
	transitions = SliderTransition

	constructor(
		sliderContainer,
		options = {},
		...images
	){
		this.setOptions(options);
		this.#sliderContainer 	= sliderContainer;
		this.opts 		= this.options;
		this.images 	= images.length ? images : Array.from(this.#loadImagesFromDom());
		this.imgCount = this.images.length;
		this.opts.loop && (this.interval = '');
		this.images.length && this.init();
		this.dragEnd = this.addUIEventsDragEnd.bind(this);
		this.dragAction = this.addUIEventsDragAction.bind(this);
	}
	
	setOptions(options) {
		this.#mergeDeep(this.options,options);
	}

 	#mergeDeep(target, source) {
		const isObject = (obj) => obj && typeof obj === 'object';
		if (!isObject(target) || !isObject(source)) {
			return source;
		}
		Object.keys(source).forEach(key => {
			const targetValue = target[key];
			const sourceValue = source[key];
			if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
				target[key] = targetValue.concat(sourceValue);
			} else if (isObject(targetValue) && isObject(sourceValue)) {
				target[key] = this.#mergeDeep(Object.assign({}, targetValue), sourceValue);
			} else {
				target[key] = sourceValue;
			}
		});
		return target;
	}

	async init() {
		try{
			this.#setIndexIncrement();
			this.#setAllIndexes(true);
			let sliderLoader	= await new SliderLoader(this.images);
			this.imgsLoaded = sliderLoader.imgLoaded;
		}
		catch(err){
			console.error(err);
			throw new Error('Slider initialising failed');
		}
		finally{
			this.opts.type === 'slider' && await this.#createSlider();
			this.opts.controls!== false && (this.opts.slidesShow < this.imgCount) && this.#addUI();
			await this.#slideTransition('right');
		}
	}

	/* LOADING AND DELETING IMAGES FROM DOM */

	#loadImagesFromDom() {
		return document.querySelectorAll(`.${this.opts.sliderClass}`)[0].children;
	}

	async #deleteImages() {
		this.#sliderContainer.innerHTML = ''; 
	}

	/* CREATE SLIDER, WRAPPER AND ELEMENTS */

	async #createSlider() {
		return new Promise((res,rej) => {
			try{
				let parentWrapper = this.#sliderContainer;
				this.#createSliderElements();
				this.sliderWrapper = parentWrapper = this.#createSliderWrapper();	
				this.#setContainerCss(parentWrapper);
				res();
			}
			catch(err){
				console.log(err);
				rej(new Error('Slider not created'));
			}
		});
	}

	#createSliderWrapper() {
		let sliderWrapper = new SliderWrapper(this.opts,this.#sliderContainer,this.sliderElements);
		return this.#sliderContainer.querySelector(`.${sliderWrapper.wrapper.className}`);
	}

	#createSliderElements() {
		//console.log(this.images,this.#sliderContainer);
		this.images.length && this.#deleteImages() && (this.sliderElements=[]);
		this.imgsLoaded.forEach((el,index) => {
			let sliderElement = new SliderElement(this.opts,this.#sliderContainer,el,index,this.imgCount);
			this.sliderElements.push(sliderElement.elementIsWrapped ? sliderElement.elementWrapper : sliderElement.elementnode);
		});
	}

	/* SET CSS FOR SLIDER CONTAINER */

	#setContainerCss(el) {
		this.#setContainerCssGrid(el);
		el.style.transitionProperty = this.#getCssTransitionProp();
	}

	#getCssTransitionProp(addProp=false) {
		return `${this.#getCssTransitionPropFromDefault()}${addProp?','+addProp:''}`;
	}

	#getCssTransitionPropFromDefault() {
		try{
			return this.transitions[this.opts.transition];
		}
		catch(err){
			new Error('Transition not found');
		}
	}

	#setContainerCssGrid(el) {
		SliderHelpers.setElStyle(el,'display','grid');
		SliderHelpers.setElStyle(el,'justifyContent','center');
		SliderHelpers.setElStyle(el,'gridTemplateColumns',this.#getGridColumnString());
		this.opts.margin && SliderHelpers.setElStyle(el,'gridColumnGap',`${this.opts.margin}px`);
	}

	#getGridColumnString() {
		if (this.opts.slidesRowWrap){
			let gridTemplateColumnsString = '';
			for (let i=0; i<this.opts.slidesShow; i++){
				gridTemplateColumnsString += `1fr `;
			}
			return `${gridTemplateColumnsString.slice(0,-1)}`;
		}
		else {
			return 'repeat(auto-fit, minmax(300px, 1fr))';
		}
	}

	/* CREATE SLIDER CONTROL ELEMENTS */
	
	#addUI() {
		this.sliderUI = new SliderUI(this.opts,this.#sliderContainer,this.sliderWrapper,this.sliderElements);
		this.opts.controls.events && this.#addUIEvents();
	}

	#addUIEvents() {
		this.opts.controls.arrows && this.#addUIEventsArrow();
		this.opts.controls.dots && this.#addUIEventsDots();
		this.#addUIEventKeys();
		this.#addUIEventsDrag();
	}

	#addUIEventsArrow() {
		this.sliderUI.arrowContainer.sliderButtonLeft.addEventListener('click', () => this.showPrevSlides());
		this.sliderUI.arrowContainer.sliderButtonRight.addEventListener('click', () => this.showNextSlides());
	}

	#addUIEventsDots() {
		this.sliderUI.dotContainer.addEventListener('click', function(e) {
			const {slide} = e.target.dataset;
			Number.isInteger(parseInt(slide)) && this.showSlides(Number(slide));
		}.bind(this), false);
	}

	#addUIEventKeys() {
		let prevKey = (this.opts.controls.direction==='horizontal'?'ArrowLeft':'ArrowUp'); 
		let nextKey = (this.opts.controls.direction==='horizontal'?'ArrowRight':'ArrowDown'); 
		document.addEventListener('keydown', function(e) {
			e.key===prevKey && this.showPrevSlides();
			e.key===nextKey && this.showNextSlides();
		}.bind(this))
		this.opts.controls.arrows && this.sliderUI.arrowContainer.sliderButtonLeft.addEventListener('keyup', (e) => (e.keyCode === 13) && this.showPrevSlides());
		this.opts.controls.arrows && this.sliderUI.arrowContainer.sliderButtonRight.addEventListener('keyup', (e) => (e.keyCode === 13) && this.showNextSlides());
		this.opts.controls.dots && this.sliderUI.dotContainer.addEventListener('keyup', function(e){
			const {slide} = e.target.dataset;
			Number.isInteger(parseInt(slide)) && (e.keyCode === 13) && this.showSlides(Number(slide));
		}.bind(this), false);
	}

	#addUIEventsDrag() {
		this.transitionTarget = this.#getTransitionTarget();
		this.sliderWrapper.addEventListener('mousedown', this.addUIEventsDragStart.bind(this));
		this.sliderWrapper.addEventListener('touchstart', this.addUIEventsDragStart.bind(this));
		this.sliderWrapper.addEventListener('touchend', this.dragEnd);
		this.sliderWrapper.addEventListener('touchmove', this.dragAction);
	}

	addUIEventsDragStart (e) {
		this.transitionDefault = this.sliderWrapper.style.transitionProperty;
    e = e || window.event;
    e.preventDefault();

    this.posInitial = this.sliderWrapper.offsetLeft;
    
    if (e.type == 'touchstart') {
      this.posX1 = e.touches[0].clientX;
    } else {
      this.posX1 = e.clientX;
			document.addEventListener("mouseup", this.dragEnd);	
			document.addEventListener("mousemove", this.dragAction);

    }
  }

  addUIEventsDragAction (e) {
    e = e || window.event;
    //console.log(this['posX2'], this.posX2);
    if (e.type == 'touchmove') {
      this.posX2 = this.posX1 - e.touches[0].clientX;
      this.posX1 = e.touches[0].clientX;
    } else {
      this.posX2 = this.posX1 - e.clientX;
      this.posX1 = e.clientX;
    }
    this.sliderWrapper.style.left = (this.sliderWrapper.offsetLeft - this.posX2) + "px";
  }
  
  addUIEventsDragEnd (e) {
		let treshold = this.opts.events.touch.threshold;
		this.sliderWrapper.style.transitionProperty = this.#getCssTransitionProp('left');
		this.sliderWrapper.style.left = (this.posInitial) + "px";		
		this.sliderWrapper.addEventListener('transitionend', (e) => {
			this.addUIEventsDragEndTransition();
		});
    this.posFinal = this.sliderWrapper.offsetLeft;
    if (this.posFinal - this.posInitial < -treshold) {
      this.showNextSlides();
			this.sliderWrapper.style.left = "0px";
    } else if (this.posFinal - this.posInitial > treshold) {
      this.showPrevSlides();
			this.sliderWrapper.style.left = "0px";
    }
		document.removeEventListener('mouseup', this.dragEnd);
		document.removeEventListener("mousemove", this.dragAction);
  }

	addUIEventsDragEndTransition() {
		this.sliderWrapper.style.transitionProperty = this.transitionDefault;
		this.sliderWrapper.removeEventListener('transitionend', this.addUIEventsDragEndTransition);
	}

	#getTransitionTarget() {
		return this.opts.slidesRowWrap ? this.sliderElements : this.sliderWrapper;
	}
	/* SETS AND CHECK INDEXES FOR CURRENT, LAST AND OTHER ELEMENTS */

	#setAllIndexes(start = false, target='right') {
		this.#setLastIndexes(start);
		this.#setCurrentIndexes(start, target);
		this.#setOtherIndexes(this.curIndex,this.lastIndex);
	}

	#setIndexIncrement() {
		this.incIndex = this.opts.slidesShow;
	}

	#setLastIndexes(start = false) {
		if (start){
			const lastSliceIndex =  this.incIndex * -1;
			this.lastIndex = this.#getIndexesArrayForProp('imgCount').splice(lastSliceIndex);
		} else {
			this.lastIndex = this.curIndex;
		}
	}

	#setCurrentIndexes(start = false, target) {
		const initialIndexes = this.#setInitialIndex(target);
		const indexOffset = this.#getIndexOverflow(target);
		if (start || this.#checkForLastIndex(target)) {
			this.curIndex = initialIndexes;
		} else if (this.#checkForFirstIndex(target)) {
				this.curIndex = this.#getIndexesArrayForProp('imgCount').splice(this.incIndex * -1);
		} else{
				this.curIndex = this.curIndex.map((value, index) => {
					return this.#setIncrementedIndex(target, value, index, indexOffset);
				});
		}
	}

	#setOtherIndexes(curIndex,lastIndex) {
		this.othIndex = this.#getIndexesArrayForProp('imgCount').filter(el => {
			const checkLast = curIndex.includes(el);
			const checkCurs = lastIndex.includes(el);
			return (!checkLast && !checkCurs);
		});
	}

	#setInitialIndex(target) {
		return this.#getIndexesArrayForProp('slidesShow',true, target);
	}

	#setIncrementedIndex(target, value, index, indexOffset) {
		let targetIndex;
		if (target==='right')
			targetIndex = value + this.incIndex + indexOffset;
		else if (target==='left')
			targetIndex = value - this.incIndex + indexOffset;
		else {
			targetIndex = this.opts.controls.dotsCount==='fitRows'?
				(target*this.opts.slidesShow) + index:
				this.#getCurrentIndexForTarget(target) + index + indexOffset;
		}
		return targetIndex;
	}

	#getIndexOverflow(target) {
		let overflowOffset = 0;
		target==='left' && this.curIndex.filter(el => (el+1-this.incIndex) < 0).length && (overflowOffset = Math.abs(this.curIndex[0] - this.incIndex)); 
		target==='right' && this.curIndex.filter(el => (el+1+this.incIndex) > this.imgCount).length && (overflowOffset = this.imgCount - this.curIndex.at(-1) - 1 - this.incIndex);
		Number.isInteger(target) && (overflowOffset = this.curIndex.map((el,ind) => el = this.#getCurrentIndexForTarget(target)+ind).filter(el => (el+1) > this.imgCount).length * -1);
		return overflowOffset;
	}

	#getIndexesArrayForProp(prop, opts = false, target='right') {
		const arrayTo = opts?this.opts[prop]:this[prop];
		if (Number.isInteger(arrayTo)){
			const arrayInitial = target==='left'?[...Array(arrayTo).keys()]:[...Array(arrayTo).keys()];
			return arrayInitial;
		}
		else throw new Error(`An error occured for the 'prop' parameter with value ${prop}. It's not existing in constant declaration.`);
	}

	#checkForLastIndex(target='right') {
		if (target==='left') return;
		if (target==='right')
			return this.curIndex.includes(this.imgCount-1);
		else if (Number.isInteger(target)) return this.curIndex.includes(this.#getIndexFitRows(target));
		else throw new Error (`An error occured for parameter "target" with value ${target}. It should be either an integer index number of the next slide or direction 'left' or 'right'`);
	}

	#checkForFirstIndex(target='left') {
		if (target==='left') 
			return this.curIndex.includes(0);
		else return false;
	}

	#checkIndexSelectedAlready(target) {
		const index = this.#getIndexFitRows(target);
		return this.curIndex.includes(index);
	}

	#getIndexFitRows(target){
		return this.opts.controls.dotsCount==='fitRows'?target*this.incIndex:target
	}
	
	#getCurrentIndexForTarget(target) {
		const newIndex = this.incIndex * Math.floor(target/this.incIndex);
		return newIndex;
	}

	/* TRANSITION AND STYLES */

	showSlides(index) {
		this.#slideTransition(false, index);
	}

	showNextSlides() {
		this.#slideTransition(false, 'right');
	}

	showPrevSlides() {
		this.#slideTransition(false, 'left');
	}

	async #slideTransition(start = true, target = 'right') {
		try{
			SliderHelpers.rmElClass(this.#sliderContainer,'progress');
			await SliderHelpers.wait(0.002);
			let isSelected = this.#checkIndexSelectedAlready(target);
			if (!start && !isSelected){
				this.sliderElements[this.curIndex].localName==='video' && SliderHelpers.pauseVideo(this.sliderElements[this.curIndex],0);
				this.#setAllIndexes(false, target);
				this.opts.controls.dots && this.sliderUI.setActiveDot(this.curIndex);
			}
			!isSelected && this.setClassesAndStyles();
		}
		catch(err){
			console.error(err);
			new Error('Slider not showing next image');
		}
		finally{
			let lastSlide = this.#checkForLastIndex();
			if (this.opts.loop || (!lastSlide)) {
				this.interval = await SliderHelpers.loop(this.opts.delay);
				await this.#slideTransition(false);
			}
		}
	}

	/* REMOVE AND ADD CUR AND PREV CLASSES / SET CSS STYLING FOR TRANSITIONS  */ 

	async setClassesAndStyles() {
		SliderHelpers.setElClass(this.#sliderContainer,'progress');
		this.removeClassesFromElementArr(this.sliderElements);
		this.addClassToElementArr(this.curIndex,this.curElementClass);
		this.addClassToElementArr(this.lastIndex,this.prevElementClass);
		await SliderHelpers.waitForElement(`.${this.curElementClass}`);
		this.#setTransitionStyles();
	}

	addClassToElementArr(indexArr,cssClass,notContains=this.curElementClass) {
		indexArr.forEach((el) => {
			!this.sliderElements[el].classList.contains(notContains) && this.sliderElements[el].classList.add(cssClass);
		});
	}

	removeClassesFromElementArr(obj) {
		obj.forEach((el) => el.classList.remove(this.curElementClass,this.prevElementClass));
	}

	/* SET TRANSITION STYLE PER TYPE */ 

	#setTransitionStyles() {
		let transitionTarget = this.sliderWrapper?this.sliderWrapper:this.#sliderContainer;
		//var transitionFunctionName = String(`setTransitionStyles${this.opts.transition.slice(0,1).toUpperCase()}${this.opts.transition.slice(1)}`);
		//this[transitionFunctionName](transitionTarget);
		if (!this.opts.slidesRowWrap) {
			transitionTarget.style.transitionProperty = this.#getCssTransitionProp('transform');
			this.#setTranslateForTarget(transitionTarget);
		}
		SliderHelpers.setElClass(transitionTarget,this.opts.transition);
		transitionTarget.querySelector('video')!==null && SliderHelpers.startVideo(transitionTarget.querySelector(`.${this.curElementClass}`).querySelector('video'),this.opts.transitionDuration);
		switch (this.opts.transition) {
			case 'slide':
				this.#setTransitionStylesTranslate(transitionTarget);
				break;
			case 'circle':
				this.#setTransitionStylesCircle(transitionTarget);
				break;
			case 'slices':
				this.#setTransitionStylesSlices(transitionTarget);
				break;	
			case 'tiles':
				this.#setTransitionStylesTiles(transitionTarget);
				break;
			case 'tiles-rotate':
				this.#setTransitionStylesTiles(transitionTarget);
				break;
			default:
				this.#setTransitionStylesFade();
				break;
		}
	}

	/* FADE TRANSITION */

	#setTransitionStylesFade(transitionTarget) {

	}

	/* SLIDE TRANSITION */

	#setTransitionStylesTranslate(transitionTarget){
		if (!this.opts.slidesRowWrap) {
			this.#setTranslateForTarget(transitionTarget);
		} else this.#setTranslateForElements();
	}

	#setTranslateForTarget(transitionTarget=this.sliderWrapper) {
		transitionTarget.style.transform = `translate3d(-${(100/this.sliderElements.length)*this.curIndex[0]}%,0,0)`;
	}

	#setTranslateForElements() {
		this.sliderElements.forEach((el,ind) => {
			el.style.transitionProperty = this.#getCssTransitionProp();
			Sliderhelpers.setCssTransitionTiming(el,this.opts.transitionTiming);
			let translateX = this.#setTranslateXForElements(ind, this.opts.slidesRowWrap);
			let translateY = this.#setTranslateYForElements(ind, this.opts.slidesRowWrap);
			this.#setStyleForElements([ind],'transform',`translate3d(${translateX},${translateY},0)`);
		});
		this.#resetTranslateForElements();
	}

	#setStyleForElements(indexArr, styleProp, styleVal) {
		indexArr === '*' && this.sliderElements.forEach((el) => SliderHelpers.setElStyle(el,styleProp,styleVal));
		indexArr !== '*' && indexArr.forEach((el) => {
			SliderHelpers.setElStyle(this.sliderElements[el],styleProp,styleVal);
		});
	}

	#setTranslateXForElements(ind, rowWrap) {
		let translateX;
		if (rowWrap) {
			((this.lastIndex.at(0) === ind) || (this.othIndex.at(0) === ind)) && (translateX = '-100%');
			((this.lastIndex.at(-1) 	=== ind) || (this.othIndex.at(-1) === ind)) && (translateX = '100%');
		}
		return translateX;
	}

	#setTranslateYForElements(ind, rowWrap) {
		let translateY = '0%';
		this.opts.slidesShow > 2 && rowWrap && (this.othIndex.includes(ind)) && (translateY = '-100%');
		return translateY;
	}

	#resetTranslateForElements(){
		let targetElements = this.sliderElements.filter((el,index) => {
			if (this.curIndex.includes(index)){
				el.originalIndex = index;
				return true;
			}
		});
		targetElements.forEach((el,ind) => {
			this.#setStyleForElements([el.originalIndex],'transform',`translate3d(0,0,0)`);
		});
	}

	/* CIRCLE TRANSITION */

	#setTransitionStylesCircle(transitionTarget){
		if (!this.opts.slidesRowWrap) {
			transitionTarget.style.transitionProperty = this.#getCssTransitionProp('transform');
			this.#setTranslateForTarget();
		}
	}

	/* SLICES TRANSITION */

	#setTransitionStylesSlices(transitionTarget){
		if (!this.opts.slidesRowWrap) {
			transitionTarget.style.transitionProperty = this.#getCssTransitionProp('transform');
			this.#setTranslateForTarget();
		}
		this.#setTransitionStylesSlicesTranslateY();
	}

	#setTransitionStylesSlicesTranslateY(){
		this.sliderElements.forEach(async (el,ind) => {
			let translateYCloneIndex = Math.floor((ind-this.curIndex[0])/this.opts.slidesShow);
			let translateYClone = `${100*translateYCloneIndex}%`;
			//await SliderHelpers.waitForElement(`.slider-transition-clone`);
			el.querySelectorAll(`.slider-transition-clone`).forEach(clone => {
				clone.style.transitionProperty = this.#getCssTransitionProp();
				SliderHelpers.setElStyle(clone,'transform',`translateY(${translateYClone})`);
			});
		})
	}

	/* TILES TRANSITION */

	#setTransitionStylesTiles(transitionTarget){
		if (!this.opts.slidesRowWrap) {
			transitionTarget.style.transitionProperty = this.#getCssTransitionProp('transform');
			this.#setTranslateForTarget();
		}
		//this.#setTransitionStylesSlicesTranslateY();
	}
}

/* TEST DATA */

const defaultOptions = {
	delay: 106,
	controls: {
		arrows: true,
		direction: 'horizontal',
		dots: true,
		dotsCount: 'fitRows', /* fitRows or all/empty */
		events: true
	},
	colorTheme:'purple',
	elementType: 'div',
	elementOverlayStyle: 'twoheads',
	fontFamily: [
		'Catamaran:400,500,600,700,800,900',
		'Montserrat:400,500,600,700,800,900',
		'Lato:300,400,700,900'
	],
	loop: true,
	margin: 0,
	responsive: [
    {
      breakpoint: 1366,
      options: {
        slidesShow: 2,
        slidesToScroll: 3,
				controls: {
					dots: false
				}
      }
    },
    {
      breakpoint: 1024,
      options: {
        slidesShow: 2,
      }
    },
    {
      breakpoint: 768,
      options: {
        slidesShow: 1,
      }
    }
  ],
	sliderClass: 'slider',
	slidesShow: 1,
	slidesRowWrap: true,
	transition: 'slices',
	transitionSegments: 5,
	transitionTiming: 'ease-out',
	type:'slider', 
	vignette: true,
	zoom: false
}

const slider1 = new SliderResponsive(defaultOptions);