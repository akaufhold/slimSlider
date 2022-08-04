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
		this.#setElementContent();
	}

	isElementWrapped() {
		return this.elementIsWrapped = (this.#opts.vignette || this.#opts.zoomOnHover) && true;
	}

	#setElementWrapper() {
		this.#index===0 && (this.#sliderContainer.innerHTML = '');
		this.elementWrapper = SliderHelpers.wrapAround(
			this.elementnode,
			SliderHelpers.createWrapperElement(this.#opts.elementWrapperClass,this.#opts.elementType)
		);
		this.#sliderContainer.insertAdjacentElement('beforeEnd',this.elementWrapper);
	}

	#setElementWrapperType(type) {
		this.#opts.elementType = type;
	}

	#setElementContent() {
		let {head,text,link} = this.elementnode.dataset;
		let headerWrap, textWrap, linkWrap;
		let elementWrapper = SliderHelpers.createWrapperElement('figcaption');
		head && (headerWrap = this.#createElementContent(head,'header',this.#opts.headerTag));
		text && (textWrap = this.#createElementContent(text,'description','p'));
		link && (linkWrap = this.#createElementContent(link,'link','a'));
		elementWrapper =  SliderHelpers.wrapAround(headerWrap,elementWrapper);
		elementWrapper =  SliderHelpers.wrapAround(textWrap,elementWrapper);
		elementWrapper =  SliderHelpers.wrapAround(linkWrap,elementWrapper);
		return elementWrapper;
	}

	#createElementContent(text, cssClass, htmlTag) {
		let element = document.createTextNode(text);
		let elementWrap = SliderHelpers.wrapAround(
			element,
			SliderHelpers.createWrapperElement(`slider-${cssClass}`,htmlTag)
		);
		return elementWrap;
	}

	#setElementStyles(el) {
		let curColumn = this.#opts.slidesRowWrap ? 
										(this.#index+1)%this.#opts.slidesPerRow : 
										(this.#index+1);
		/*let lastElementCount = this.#slidesCount % this.#opts.slidesPerRow; 
		let lastElementsOffset = this.#slidesCount - lastElementCount;
		(this.#index+1) > lastElementsOffset && (curColumn+=lastElementCount);
		console.log(this.#index, lastElementsOffset, (this.#index+1) > lastElementsOffset);*/
		SliderHelpers.setElStyle(el,'gridRowStart',1);
		(curColumn === 0)
			?SliderHelpers.setElStyle(el,'gridColumnStart',this.#opts.slidesPerRow)
			:SliderHelpers.setElStyle(el,'gridColumnStart',curColumn);
	}

	#addElementClassesFromOptions(optionName,optionValue,cssClass,target=this.elementnode) {
		(this.#opts[optionName] === optionValue) && SliderHelpers.setElClass(target,cssClass);
	}
}
