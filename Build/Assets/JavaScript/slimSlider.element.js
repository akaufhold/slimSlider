import SliderHelpers from './slimSlider.helpers';

export default class SliderElement {
	#sliderContainer;
	elementWrapper = false;
	elementIsWrapped = false;
	elementnode;
	opts;
	#index;
	#slidesCount;
	#dataAttrCount;

	constructor(
		options,
		sliderContainer,
		element,
		index,
		slidesCount
	){
		for (const option of Object.entries(options)) {
			this.opts = options;
		}

		this.#sliderContainer = sliderContainer;
		this.elementnode 			= element;
		this.#index 					= this.opts.index = index;
		this.#slidesCount     = this.opts.slidesCount = slidesCount;
		this.#dataAttrCount   = Object.keys(element.dataset).length;
		this.init();
	}

	init() {
		(typeof this.elementnode.dataset==='object') && this.#setElementWrapperType('figure');
		this.isElementWrapped() && this.#setElementWrapper();
		this.#setElementStyles(this.elementWrapper?this.elementWrapper:this.elementnode);
		this.#setElementClasses();
		SliderHelpers.setElClass(this.elementnode,this.opts.elementClass);
		this.#dataAttrCount && this.elementWrapper.appendChild(this.#createElementContentWrapper(this.opts.transition));
		this.#createExtraElements(this.opts.transition);
		this.#setElementProperties(this.opts.transition);
	}

	#setElementWrapperType(type) {
		this.opts.elementType = type;
	}

	isElementWrapped() {
		return this.elementIsWrapped = (this.opts.vignette || this.opts.zoom || typeof this.elementnode.dataset==='object') && true;
	}

	#setElementWrapper() {
		this.#index===0 && (this.#sliderContainer.innerHTML = '');
		this.elementWrapper = SliderHelpers.wrapAround(
			this.elementnode,
			SliderHelpers.createWrapperElement(this.opts.elementWrapperClass,this.opts.elementType)
		);
		this.#sliderContainer.insertAdjacentElement('beforeEnd',this.elementWrapper);
		this.#sliderContainer.classList.add(`slider-color-${this.opts.colorTheme}`);
	}

	#setElementStyles(el) {
		let curColumn = this.opts.slidesRowWrap ? (this.#index+1)%this.opts.slidesShow : (this.#index+1);
		SliderHelpers.setElStyle(el,'gridRowStart',1);
		(curColumn === 0) ? SliderHelpers.setElStyle(el,'gridColumnStart',this.opts.slidesShow) : SliderHelpers.setElStyle(el,'gridColumnStart',curColumn);
	}

	#setElementClasses() {
		this.opts.type === 'gallery' && SliderHelpers.setElClass(this.elementWrapper,'parallel');
		this.opts.zoom && SliderHelpers.setElClass(this.elementWrapper,'zoom');
		this.opts.vignette && SliderHelpers.setElClass(this.elementWrapper,'vignette');
		this.elementnode.querySelector('video')!==null && SliderHelpers.setElClass(this.elementWrapper,'video');
	}

	#createElementContentWrapper(transition) {
		let {head,text,link} = this.elementnode.dataset;
		let headerWrap, textWrap, linkWrap, elementWrapper = SliderHelpers.createWrapperElement('slider-image-overlay','div');
		elementWrapper.classList.add(`overlay-style-${this.opts.elementOverlayStyle}`);
		elementWrapper.style.fontSize = `${11-this.opts.slidesShow}px`;
		head && (headerWrap = this.#createElementContent(head,'header',this.opts.headerTag)) && (elementWrapper = SliderHelpers.wrapAround(headerWrap,elementWrapper));
		text && (textWrap = this.#createElementContent(text,'description','p')) && (elementWrapper = SliderHelpers.wrapAround(textWrap,elementWrapper));
		link && (linkWrap = this.#createElementContent('mehr','link','a')) && (elementWrapper =  SliderHelpers.wrapAround(linkWrap,elementWrapper));
		linkWrap = this.#createElementButton(linkWrap);
		return elementWrapper;
	}

	#createElementContent(text, cssClass, htmlTag) {
		let textNode = document.createTextNode(text);
		return SliderHelpers.wrapAround(
			textNode,
			SliderHelpers.createWrapperElement(`slider-${cssClass}`,htmlTag)
		);
	}

	#createElementButton(linkWrap) {
		let linkChilds;
		if (this.opts.overlay.button==='scale') {
			for (var i = 0; i < 4; i++) {
				linkChilds = this.#createElementContent('','link-back','span');
				linkWrap = SliderHelpers.wrapAround(linkChilds, linkWrap);
			}
			SliderHelpers.setElClass(linkWrap,`slider-link-${this.opts.overlay.button}`);
		}
		return linkWrap;
	}

	#setElementProperties(transition) {
		this.elementnode.style.setProperty('--animation-duration', `${this.opts.delay}s`);
		((transition==='circle') || (transition==='rect')) && this.#sliderContainer.style.setProperty('--stroke-width', `${100/this.opts.transitionSegments*2}%`);
	}

	#createExtraElements(transition) {
		transition==='circle' && this.#createEECirle();
		transition==='rect' && this.#createEERect();
		transition==='slices' && this.#createEEClones(transition);
		transition==='tiles' && this.#createEEClones(transition);
		transition==='tiles-rotate' && this.#createEEClones(transition);
		transition==='shutter' && this.#createEEClones(transition);
	}

	#createEECirle() {
		this.elementWrapper.insertAdjacentElement('beforeend',SliderHelpers.createSvg('circle','center',this.opts.transitionSegments));
	}

	#createEERect() {
		this.elementWrapper.insertAdjacentElement('beforeend',SliderHelpers.createSvg('rect','center',this.opts.transitionSegments));
	}

	async #createEEClones(transition) {
		this.elementWrapper.style.setProperty('--transition-delay',`${this.opts.transitionDuration/1000}s`);
		this.elementWrapper.style.setProperty('--transition-duration',`${this.opts.transitionDuration/1000}s}`);
		let clonedElements = await this.#createClones(this.elementnode,transition,this.opts);
		this.elementWrapper.insertAdjacentElement('beforeend',clonedElements);
	}

	/* TRANSITION CLONES */

	#createClones(sliderElement, cloneType, options) {
		let cloneWrapper = document.createElement('div');
		cloneWrapper.classList.add('slider-transition-overlay');
		sliderElement.localName==='video' && cloneType==='shutter' && this.#createElementContentWrapperBackground(cloneWrapper,this.opts.transition);
		cloneType === 'slices' && (cloneWrapper = this.#createCloneSlices(sliderElement,cloneWrapper,options,cloneType));
		cloneType === 'shutter' && (cloneWrapper = this.#createCloneSlices(sliderElement,cloneWrapper,options,cloneType));
		cloneType === 'tiles' && (cloneWrapper = this.#createCloneTiles(sliderElement,cloneWrapper,options,cloneType));
		cloneType === 'tiles-rotate' && (cloneWrapper = this.#createCloneTiles(sliderElement,cloneWrapper,options,cloneType));
		return cloneWrapper;
	}

	async #createElementContentWrapperBackground(elementWrapper, transition) {
		let loadedImg = await SliderHelpers.getLoadedElement(this.elementnode);
		elementWrapper.appendChild(this.#createCloneVideoCanvas(this.elementnode,loadedImg,'back',0,'shutter'));
	}

	/* TRANSITION SLICES AND SHUTTER */

	async #createCloneSlices(sliderElement, cloneWrapper, options, cloneType) {
		let translateY = `${100*(Math.floor(options.index/options.slidesShow))}%`;
		let loadedImg = await SliderHelpers.getLoadedElement(sliderElement,sliderElement.localName);
		for (var x = 0; x < options.transitionSegments; x++) {
			let clone = document.createElement('div');
			let cloneElement = await this.#createCloneElement(sliderElement, loadedImg, x, '_', cloneType);
			this.#createCloneSliceStyle(clone, options, x, cloneType, translateY);
			(cloneType=='shutter') && SliderHelpers.setElStyle(cloneElement,'transform',`translate3d('-10%',0,0)`);
			SliderHelpers.setElClass(cloneElement,`slider-transition-clone-img`);
			clone.appendChild(cloneElement);
			cloneWrapper.appendChild(clone);
		}
		return cloneWrapper;
	}

	#createCloneSliceStyle(clone, options, i, cloneType, translateY) {
		if (cloneType=='slices') {
			let transitionDuration = `${(options.transitionDuration-((options.transitionDuration/(options.transitionSegments*2))*i))/1000}s`;
			SliderHelpers.setElStyle(clone,'transitionDuration',transitionDuration);
			SliderHelpers.setElStyle(clone,'animationDuration',transitionDuration);
			SliderHelpers.setElStyle(clone,'transform',`translateY(${translateY})`);
		}
		if (cloneType=='shutter') {
			let translateX = `${Math.round(Math.random()*80)*(Math.round(Math.random()) * 2 - 1)}%`;
			SliderHelpers.setElStyle(clone,'transform',`translate3d(${translateX},0,0)`);
		}
		SliderHelpers.setElClass(clone,`slider-transition-clone`);
		SliderHelpers.setElStyle(clone,'width',`${100/options.transitionSegments}%`);
		SliderHelpers.setCssTransitionTiming(clone,options.transitionTiming);
	}

	/* TRANSITION TILES */

	async #createCloneTiles(sliderElement, cloneWrapper, options, cloneType) {
		let loadedImg = await SliderHelpers.getLoadedElement(sliderElement);
		//sliderElement.localName==='video' && SliderHelpers.pauseVideo(sliderElement,0);
		for (let y = 0; y < options.transitionSegments; y++) {
			for (let x = 0; x < options.transitionSegments; x++) {
				let clone = document.createElement('div');
				this.#createCloneTilesStyle(clone, options, cloneType, x, y);
				let cloneElement = await this.#createCloneElement(sliderElement, loadedImg, x, y, cloneType);
				SliderHelpers.setElClass(cloneElement,`slider-transition-clone-img`);
				clone.appendChild(cloneElement);
				cloneWrapper.appendChild(clone);
			}
		}
		return cloneWrapper;
	}

	#createCloneTilesStyle(clone, options, cloneType, x, y) {
		let translateX = `${50*(x-(options.transitionSegments/2))}%`;
		let translateY = `${50*(y-(options.transitionSegments/2))}%`;
		let transitionDuration = `${(options.transitionDuration-((options.transitionDuration/options.transitionSegments)*x))/1000}s`;
		let transitionDelay = `${(x+y/(options.transitionSegments*2-x))*options.transitionSegments/options.transitionSegments/1000*(options.transitionDuration/options.transitionSegments)}s`;
		cloneType === 'tiles-rotate' && (transitionDelay = `${(x * options.transitionDuration/10000 + y * options.transitionDuration/10000)}s`);
		cloneType=='tiles' && SliderHelpers.setElStyle(clone,'transform',`translate3d(${translateX},${translateY},0)`);
		SliderHelpers.setElStyle(clone,'transitionDuration',transitionDuration);
		SliderHelpers.setElStyle(clone,'animationDuration',transitionDuration);
		SliderHelpers.setElStyle(clone,'transitionDelay',transitionDelay);
		SliderHelpers.setElStyle(clone,'animationDelay',transitionDelay);
		SliderHelpers.setElClass(clone,`slider-transition-clone`);
		SliderHelpers.setElStyle(clone,'width',`${100/options.transitionSegments}%`);
		SliderHelpers.setElStyle(clone,'height',`${100/options.transitionSegments}%`);
		SliderHelpers.setCssTransitionTiming(clone,options.transitionTiming);
	}
	
	/* ClONE ELEMENTS */

	async #createCloneElement(sliderElement, loadedElement, x, y, cloneType) {
		let clonedImg;
		sliderElement.localName==='img' && (clonedImg = this.#createCloneImage(sliderElement, loadedElement, x, y, cloneType));
		sliderElement.localName==='video' && (clonedImg = this.#createCloneVideoCanvas(sliderElement, loadedElement, x, y, cloneType));
		return clonedImg;
	}

	#createCloneImage(originalImg, loadedImg, x, y, cloneType) {
		let clonedImg = document.createElement('img');
		clonedImg.src = originalImg.src;
		clonedImg.width = loadedImg.target.clientWidth;
		clonedImg.height = loadedImg.target.clientHeight;
		clonedImg.style.left = `${x*-100}%`;
		cloneType.includes('tiles') && (clonedImg.style.top = `${y*-100}%`);
		SliderHelpers.setElClass(clonedImg,`slider-transition-clone-img`);
		return clonedImg;
	};

	#createCloneVideoCanvas(sliderElement, loadedElement, x, y, cloneType) {
		let canvas = document.createElement('canvas');
		let {clientWidth:width, clientHeight:height} = loadedElement.target;
		Object.assign(canvas,{width, height});
		canvas.style.left = `${x*-100}%`;
		cloneType.includes('tiles') && (canvas.style.top = `${y*-100}%`);
		x ==='back' && (canvas.classList.add(`slider-transition-clone-img${x}`));;
		sliderElement.addEventListener("seeked", function(e){
			let ctx = canvas.getContext("2d");
			ctx.drawImage(sliderElement, 0, 0, width, height);
			ctx.filter = 'contrast(100%)';
		}, {once : true})

		return canvas;
	};

}
