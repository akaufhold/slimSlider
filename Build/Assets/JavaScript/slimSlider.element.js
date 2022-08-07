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
		this.#setElementClasses();
		SliderHelpers.setElClass(this.elementnode,this.#opts.elementClass);
		this.elementWrapper.appendChild(this.#createElementContentWrapper());
		this.#createAdditionalElements(this.#opts.transition);
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
		this.#sliderContainer.classList.add(`slider-color-${this.#opts.colorTheme}`);
	}

	#setElementStyles(el) {
		let curColumn = this.#opts.slidesRowWrap ? (this.#index+1)%this.#opts.slidesPerRow : (this.#index+1);
		SliderHelpers.setElStyle(el,'gridRowStart',1);
		(curColumn === 0) ? SliderHelpers.setElStyle(el,'gridColumnStart',this.#opts.slidesPerRow) : SliderHelpers.setElStyle(el,'gridColumnStart',curColumn);
	}

	#setElementClasses() {
		this.#opts.type === 'gallery' && SliderHelpers.setElClass(this.elementWrapper,'parallel');
		this.#opts.zoomOnHover && SliderHelpers.setElClass(this.elementWrapper,'zoom');
		this.#opts.vignette && SliderHelpers.setElClass(this.elementWrapper,'vignette');
	}

	#createAdditionalElements(transition) {
		transition==='circle' && this.#createAddtionalElementsCirle();
		transition==='rect' && this.#createAddtionalElementsRect();
		((transition==='circle') || (transition==='rect')) && this.#sliderContainer.style.setProperty('--stroke-width', `${100/this.#opts.svgAmount*2}%`);
	}

	#createAddtionalElementsCirle(){
		this.elementWrapper.insertAdjacentElement('beforeend',SliderHelpers.createSvg('circle','center',this.#opts.svgAmount));
	}

	#createAddtionalElementsRect(){
		this.elementWrapper.insertAdjacentElement('beforeend',SliderHelpers.createSvg('rect','center',this.#opts.svgAmount));
	}

	#createElementContentWrapper() {
		let {head,text,link} = this.elementnode.dataset;
		let headerWrap, textWrap, linkWrap, elementWrapper = SliderHelpers.createWrapperElement('slider-image-overlay','div');
		elementWrapper.classList.add(`overlay-style-${this.#opts.elementOverlayStyle}`);
		elementWrapper.style.fontSize = `${11-this.#opts.slidesPerRow}px`;
		head && (headerWrap = this.#createElementContent(head,'header',this.#opts.headerTag)) && (elementWrapper = SliderHelpers.wrapAround(headerWrap,elementWrapper));
		text && (textWrap = this.#createElementContent(text,'description','p')) && (elementWrapper = SliderHelpers.wrapAround(textWrap,elementWrapper));
		link && (linkWrap = this.#createElementContent('mehr','link','a')) && (elementWrapper =  SliderHelpers.wrapAround(linkWrap,elementWrapper));
		return elementWrapper;
	}

	#createElementContent(text, cssClass, htmlTag) {
		let textNode = document.createTextNode(text);
		return SliderHelpers.wrapAround(
			textNode,
			SliderHelpers.createWrapperElement(`slider-${cssClass}`,htmlTag)
		);
	}
}
