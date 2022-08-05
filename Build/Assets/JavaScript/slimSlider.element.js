import SliderHelpers from './slimSlider.helpers';

export default class SliderElement {
	#sliderContainer;
	elementWrapper = false;
	elementIsWrapped = false;
	elementnode;
	#opts;
	#index;
	#slidesCount;

	constructor(
		options,
		sliderContainer,
		element,
		index,
		slidesCount
	){
		for (const option of Object.entries(options)) {
			this.#opts = options;
		}
		this.#sliderContainer = sliderContainer;
		this.elementnode 			= element;
		this.#index 					= index;
		this.#slidesCount     = slidesCount;
		this.init();
	}

	init() {
		(typeof this.elementnode.dataset==='object') && this.#setElementWrapperType('figure');
		this.isElementWrapped() && this.#setElementWrapper();
		this.#setElementStyles(this.elementWrapper?this.elementWrapper:this.elementnode);
		this.#addElementClassesFromOptions('type','gallery','parallel');
		this.#addElementClassesFromOptions('zoomOnHover',true,'zoom');
		this.#addElementClassesFromOptions('vignette',true,'vignette',this.elementWrapper);
		SliderHelpers.setElClass(this.elementnode,this.#opts.elementClass);
		this.elementWrapper.appendChild(this.#getElementContentContainer());
	}

	#setElementWrapperType(type) {
		this.#opts.elementType = type;
	}

	isElementWrapped() {
		return this.elementIsWrapped = (this.#opts.vignette || this.#opts.zoomOnHover || typeof this.elementnode.dataset==='object') && true;
	}

	#setElementWrapper() {
		this.#index===0 && (this.#sliderContainer.innerHTML = '');
		this.elementWrapper = SliderHelpers.wrapAround(
			this.elementnode,
			SliderHelpers.createWrapperElement(this.#opts.elementWrapperClass,this.#opts.elementType)
		);
		this.#sliderContainer.insertAdjacentElement('beforeEnd',this.elementWrapper);
	}

	#setElementStyles(el) {
		let curColumn = this.#opts.slidesRowWrap ? 
										(this.#index+1)%this.#opts.slidesPerRow : 
										(this.#index+1);
		SliderHelpers.setElStyle(el,'gridRowStart',1);
		(curColumn === 0)
			?SliderHelpers.setElStyle(el,'gridColumnStart',this.#opts.slidesPerRow)
			:SliderHelpers.setElStyle(el,'gridColumnStart',curColumn);
	}

	#addElementClassesFromOptions(optionName,optionValue,cssClass,target=this.elementnode) {
		(this.#opts[optionName] === optionValue) && SliderHelpers.setElClass(target,cssClass);
	}

	#createElementContent(text, cssClass, htmlTag) {
		let element = document.createTextNode(text);
		return SliderHelpers.wrapAround(
			element,
			SliderHelpers.createWrapperElement(`slider-${cssClass}`,htmlTag)
		);
	}

	#createAdditionalElements(parentWrapper,transition) {
		let circle = SliderHelpers.createCircleSvg();
		if (transition==='circle'){
			this.#sliderContainer.insertAdjacentHTML('beforeend',SliderHelpers.createCircleSvg());
			this.#sliderContainer.insertAdjacentHTML('beforeend',SliderHelpers.createCircleSvg('right'));
		}
		this.#sliderContainer.appendChild(circle);
	}

	#getElementContentContainer() {
		let {head,text,link} = this.elementnode.dataset;
		let headerWrap, textWrap, linkWrap, elementWrapper = SliderHelpers.createWrapperElement('slider-image-overlay','div');
		elementWrapper.classList.add(`slider-color-${this.#opts.elementOverlayColor}`,`overlay-style-${this.#opts.elementOverlayStyle}`);
		head && (headerWrap = this.#createElementContent(head,'header',this.#opts.headerTag)) && (elementWrapper = SliderHelpers.wrapAround(headerWrap,elementWrapper));
		text && (textWrap = this.#createElementContent(text,'description','p')) && (elementWrapper = SliderHelpers.wrapAround(textWrap,elementWrapper));
		link && (linkWrap = this.#createElementContent('mehr','link','a')) && (elementWrapper =  SliderHelpers.wrapAround(linkWrap,elementWrapper));
		return elementWrapper;
	}
}
