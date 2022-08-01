import SliderHelpers from './slimSlider.helpers';

export default class SliderElement {
	#sliderContainer;
	elementWrapper = false;
	elementIsWrapped = false;
	elementnode;
	#opts;
	#index;

	constructor(
		options,
		sliderContainer,
		element,
		index
	){
		for (const option of Object.entries(options)) {
			this.#opts = options;
		}
		this.#sliderContainer = sliderContainer;
		this.elementnode 			= element;
		this.#index 					= index;
		this.init();
	}

	init() {
		this.isElementWrapped() && this.setElementWrapper();
		this.setElementStyles(this.elementWrapper?this.elementWrapper:this.elementnode);
		this.addElementClassesFromOptions('type','gallery','parallel');
		this.addElementClassesFromOptions('zoomOnHover',true,'zoom');
		SliderHelpers.setElClass(this.elementnode,this.#opts.elementClass);
	}

	isElementWrapped(){
		return this.elementIsWrapped = (this.#opts.vignette || this.#opts.zoomOnHover) && true;
	}

	setElementWrapper() {
		this.#index===0 && (this.#sliderContainer.innerHTML = '');
		this.elementWrapper = SliderHelpers.wrapAround(
			this.elementnode,
			SliderHelpers.createWrapperElement(this.#opts.elementWrapperClass,this.#opts.elementType)
		);
		this.#sliderContainer.insertAdjacentElement('beforeEnd',this.elementWrapper);
	}

	setElementStyles(el) {
		let curColumn = this.#opts.slidesRowWrap ? 
										(this.#index+1)%this.#opts.slidesPerRow : 
										(this.#index+1);
		SliderHelpers.setElStyle(el,'gridRowStart',1);
		(curColumn === 0)
			?SliderHelpers.setElStyle(el,'gridColumnStart',this.#opts.slidesPerRow)
			:SliderHelpers.setElStyle(el,'gridColumnStart',curColumn);
	}

	addElementClassesFromOptions(optionName,optionValue,cssClass) {
		(this.#opts[optionName] === optionValue) && SliderHelpers.setElClass(this.elementnode,cssClass);
	}
}
