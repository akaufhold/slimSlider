'use strict';

import '../Scss/slimSlider.scss';

import SliderHelpers from './slimSlider.helpers';
import SliderWrapper from './slimSlider.wrapper';
import SliderElement from './slimSlider.element';
import SliderUI from './slimSlider.ui';

class Slider {
	/* DOM ELEMENTS */
	#sliderContainer;
	#sliderWrapper = false;
	sliderElements = [];
	imgsLoaded = false;
	
	/* USER INTERFACE */
	sliderUI;

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
			keys: true,
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
		elementType:'picture',
		elementClass:'slider-image',
		elementOverlayStyle:'circle',
		elementOverlayColor:'red',
		headerTag: 'h3',
		transition: 'circle', /* fade, slide or rotate */
		transitionTiming: 'linear',
		type: 'slider', /* slider or gallery */
		vignette: false,
		zoomOnHover: true
	}

	transitions = {
		fade: 'opacity',
		slide: 'transform',
		rotate: 'transform',
		clip: 'clip',
		circle: 'fill',
		blur: 'transform'
	}

	constructor(
		sliderContainer,
		options = {},
		...images
	){
		for (const option of Object.entries(options)){
			this.options[option[0]] = options[option[0]] || option[1];
		}
		this.#sliderContainer 	= sliderContainer;
		this.opts 		= this.options;
		this.images 	= images.length ? images : Array.from(this.#loadImagesFromDom());
		this.imgCount = this.images.length;
		this.opts.loop && (this.interval = '');
		this.#setIndexIncrement();
		this.images.length && this.init();
	}

	async init() {
		try{
			this.#setAllIndexes(true);
			this.imgsLoaded 		 		= await this.#loadAllImages(this.opts);
		}
		catch(err){
			console.error(err);
			throw new Error('Slider initialising failed');
		}
		finally{
			this.opts.type === 'slider' && this.#createSlider();
			this.opts.controls!== false && (this.opts.slidesPerRow < this.imgCount) && this.#addUI();
			await this.#slideTransition('right');
		}
	}

	/* LAZYLOADING IMAGES */

	#loadImagesFromDom() {
		return document.querySelectorAll(`.${this.opts.sliderClass}`)[0].children;
	}

	async #loadAllImages() {
		try{
			console.log(!this.imgsLoaded);
			if (!this.imgsLoaded) {
				/*typeof this.images=='object' && this.images.map(el => Object.assign(el.getAttribute('src')));*/
				//console.log(await Promise.all(this.images.map(async image => this.#loadSingleImage(image))));
				return await Promise.all(this.images.map(async image => this.#loadSingleImage(image)));

			}	else {
				console.log(this.imgsLoaded);
				return Promise.resolve();
			}
		}catch(error) {
			new Error(`Image loading failed `); 
		}
	};

	async #loadSingleImage(path) {
		try {
			return await this.#createImage(path);
		}
		catch(err){
			console.error(err)
		}
	};

	async #createImage(path) {
		return new Promise(function(res,rej) {
			let image;
			if (typeof path==='string') {
				image = document.createElement('img');
				image.src = path;
			} else {
				image = Object.assign(path);
			}
			image.addEventListener('load', () => res(image), false);
			image.addEventListener('error', () => rej(new Error(`Failed to load img > ${image.src}`)), false);
			image.dispatchEvent(new Event('load'));
		});
	}

	async #deleteImages() {
		this.#sliderContainer.innerHTML = ''; 
	}

	/* CREATE SLIDER, WRAPPER AND ELEMENTS */

	#createSlider() {
		try{
			let parentWrapper = this.#sliderContainer;
			this.#createSliderElements();
			//if ((this.opts.slidesPerRow > 1) || (!this.opts.slidesRowWrap)){
				this.#sliderWrapper = parentWrapper = this.#createSliderWrapper();	
			//}

			this.#setContainerCss(parentWrapper);
		}
		catch(err){
			console.log(err);
			new Error('Slider not created');
		}
	}

	#createSliderWrapper() {
		let sliderWrapper = new SliderWrapper(this.opts,this.#sliderContainer,this.sliderElements);
		return this.#sliderContainer.querySelector(`.${sliderWrapper.wrapper.className}`);
	}

	#createSliderElements() {
		this.images.length && this.#deleteImages();
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

	#setCssTransitionTiming(el,prop) {
		el.style.transitionTiming = `${prop}`;
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
	
	#addUI() {
		this.sliderUI = new SliderUI(this.opts,this.#sliderContainer,this.#sliderWrapper,this.sliderElements);
		this.opts.controls.events && this.#addUIEvents();
	}

	#addUIEvents() {
		this.opts.controls.events && this.opts.controls.arrows && this.#addUIEventsArrow();
		this.opts.controls.events && this.opts.controls.dots && this.#addUIEventsDots();
		this.opts.controls.events && this.#addUIEventKeys();
		this.opts.controls.touch && this.#addUIEventsDrag();
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
		document.addEventListener('keydown', function(e) {
			e.key==='ArrowLeft' && this.showPrevSlides();
			e.key==='ArrowRight' && this.showNextSlides();
		}.bind(this))
		this.sliderUI.arrowContainer.sliderButtonLeft.addEventListener('keyup', (e) => (e.keyCode === 13) && this.showPrevSlides());
		this.sliderUI.arrowContainer.sliderButtonRight.addEventListener('keyup', (e) => (e.keyCode === 13) &&  this.showNextSlides());
		this.sliderUI.dotContainer.addEventListener('keyup', function(e){
			const {slide} = e.target.dataset;
			Number.isInteger(parseInt(slide)) && (e.keyCode === 13) && this.showSlides(Number(slide));
		}.bind(this), false);
	}

	#addUIEventsDrag() {
			this.sliderElements.onmousedown = dragStart;
			this.sliderElements.addEventListener('touchstart', this.#addUIEventsDragStart);
			this.sliderElements.addEventListener('touchend', this.#addUIEventsDragEnd);
			this.sliderElements.addEventListener('touchmove', this.#addUIEventsDragAction);
	}

	#addUIEventsDragStart (e) {
    e = e || window.event;
    e.preventDefault();
    posInitial = items.offsetLeft;
    
    if (e.type == 'touchstart') {
      posX1 = e.touches[0].clientX;
    } else {
      posX1 = e.clientX;
      document.onmouseup = this.#addUIEventsDragEnd;
      document.onmousemove = this.#addUIEventsDragAction;
    }
  }

  #addUIEventsDragAction (e) {
    e = e || window.event;
    
    if (e.type == 'touchmove') {
      posX2 = posX1 - e.touches[0].clientX;
      posX1 = e.touches[0].clientX;
    } else {
      posX2 = posX1 - e.clientX;
      posX1 = e.clientX;
    }
    items.style.left = (items.offsetLeft - posX2) + "px";
  }
  
  #addUIEventsDragEnd (e) {
    posFinal = items.offsetLeft;
    if (posFinal - posInitial < -threshold) {
      shiftSlide(1, 'drag');
    } else if (posFinal - posInitial > threshold) {
      shiftSlide(-1, 'drag');
    } else {
      items.style.left = (posInitial) + "px";
    }

    document.onmouseup = null;
    document.onmousemove = null;
  }

	/* SETS AND CHECK INDEXES FOR CURRENT, LAST AND OTHER ELEMENTS */

	#setAllIndexes(start = false, target='right') {
		this.#setLastIndexes(start);
		this.#setCurrentIndexes(start, target);
		this.#setOtherIndexes(this.curIndex,this.lastIndex);
	}

	#setIndexIncrement() {
		this.incIndex = this.opts.slidesPerRow;
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
		return this.#getIndexesArrayForProp('slidesPerRow',true, target);
	}

	#setIncrementedIndex(target, value, index, indexOffset) {
		let targetIndex;
		if (target==='right')
			targetIndex = value + this.incIndex + indexOffset;
		else if (target==='left')
			targetIndex = value - this.incIndex + indexOffset;
		else {
			targetIndex = this.opts.controls.dotsCount==='fitRows'?
				(target*this.opts.slidesPerRow) + index:
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
			let isSelected = this.#checkIndexSelectedAlready(target);
			if (!start && !isSelected){
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
		let transitionTarget = this.#sliderWrapper?this.#sliderWrapper:this.#sliderContainer;
		//var transitionFunctionName = String(`setTransitionStyles${this.opts.transition.slice(0,1).toUpperCase()}${this.opts.transition.slice(1)}`);
		//this[transitionFunctionName](transitionTarget);
		if (!this.opts.slidesRowWrap) {
			transitionTarget.style.transitionProperty = this.#getCssTransitionProp('transform');
			this.#setTranslateForTarget(transitionTarget);
		}
		switch (this.opts.transition) {
			case 'fade':
				SliderHelpers.setElClass(transitionTarget,'fade');
				//this.#setTransitionStylesFade(transitionTarget);
				break;
			case 'slide':
				SliderHelpers.setElClass(transitionTarget,'slide');
				this.#setTransitionStylesTranslate(transitionTarget);
				break;
			case 'clip':
				SliderHelpers.setElClass(transitionTarget,'clip');
				//this.#setTransitionStylesClip(transitionTarget);
				break;
			case 'circle':
				SliderHelpers.setElClass(transitionTarget,'circle');
				this.#setTransitionStylesCircle(transitionTarget);
				break;
			case 'blur':
				SliderHelpers.setElClass(transitionTarget,'blur');
				//this.#setTransitionStylesCircle(transitionTarget);
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

	#setTranslateForTarget(transitionTarget=this.#sliderWrapper) {
		transitionTarget.style.transform = `translate3d(-${(100/this.sliderElements.length)*this.curIndex[0]}%,0,0)`;
	}

	#setTranslateForElements() {
		this.sliderElements.forEach((el,ind) => {
			el.style.transitionProperty = this.#getCssTransitionProp();
			this.#setCssTransitionTiming(el,this.opts.transitionTiming);
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
		this.opts.slidesPerRow > 2 && rowWrap && (this.othIndex.includes(ind)) && (translateY = '-100%');
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

	/* CLIP TRANSITION */

	#setTransitionStylesClip(transitionTarget){

	}

	/* CIRCLE TRANSITION */

	#setTransitionStylesCircle(transitionTarget){
		if (!this.opts.slidesRowWrap) {
			transitionTarget.style.transitionProperty = this.#getCssTransitionProp('transform');
			this.#setTranslateForTarget();
		}
	}
}

const defaultOptions = {
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
	slidesPerRow: 2,
	slidesRowWrap: false,
	transition: 'blur',
	transitionTiming: 'ease-in-out',
	type:'slider', 
	vignette: true,
	zoomOnHover: false
}

document.querySelectorAll(`.${defaultOptions.sliderClass}`).forEach(sliderElement => {
	const slider1 = new Slider(sliderElement,defaultOptions
		/*,'Public/Images/img-1.jpg','Public/Images/img-2.jpg','Public/Images/img-3.jpg','Public/Images/img-4.jpg','Public/Images/img-5.jpg','Public/Images/img-6.jpg'*/
	);
});

