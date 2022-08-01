import SliderHelpers from './slimSlider.helpers';

export default class SliderControls {
	#sliderContainer;
	#sliderWrapper;
	#sliderElements;

	controlContainer = false;
	dotContainer = false;
	arrowContainer = false;

	#controlCssClasses = {
		container: {
			name: 'slider-controls',
			dotContainer: {
				name: 'slider-control-dots',
				dot: {
					name: 'slider-control-dot'
				}
			},
			arrowContainer: {
				name: 'slider-control-arrows',
				arrow: {
					name: 'slider-control-arrow'
				}
			}
		}
	};	

	#opts;

	constructor(
		options,
		sliderContainer,
		sliderWrapper,
		sliderElements
	){
		for (const option of Object.entries(options)) {
			this.#opts = options;
		}
		this.#sliderContainer = sliderContainer;
		this.#sliderWrapper   = sliderWrapper;
		this.#sliderElements 	= sliderElements;
		this.init();
		//console.log(this.#sliderContainer);
	}

	init() {
		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add(this.#controlCssClasses.container.name);
		this.#opts.controls.dots && this.#addControlDots();
		this.#opts.controls.arrows && this.#addControlArrows();
		this.#sliderContainer.appendChild(this.controlContainer);
		this.setActiveDot(this.#opts.controls.dotsCount==='fitRows'?[0]:[...Array(this.#opts.slidesPerRow).keys()]); 
			//this.setActiveDot([0]);
	}

	#addControlDots() {
		let elementsArray = this.#sliderElements;
		this.dotContainer = document.createElement('div');
		this.dotContainer.classList.add(this.#controlCssClasses.container.dotContainer.name);
		(this.#opts.controls.dotsCount === 'fitRows') && (elementsArray = this.#addControlDotsArray(this.#sliderElements.slice()));
		elementsArray.forEach((_,index) => {
			this.dotContainer.insertAdjacentHTML('beforeEnd',`<div class="${this.#controlCssClasses.container.dotContainer.dot.name}" data-slide="${index}"></div>`);
		});
		this.controlContainer.appendChild(this.dotContainer);
	}

	#addControlDotsArray(controlArray) {
		return controlArray.filter((_,index) => {
			let controlIndex = (index+1) * this.#opts.slidesPerRow;
			return this.#sliderElements[controlIndex-1]!==undefined;
		})
	}

	#addControlArrows() {
		this.arrowContainer = {}
		this.arrowContainer.wrapper = document.createElement('div');
		this.arrowContainer.wrapper.classList.add(this.#controlCssClasses.container.arrowContainer.name);
		this.arrowContainer.sliderButtonLeft = this.#addControlArrowsSingle('left');
		this.arrowContainer.sliderButtonRight = this.#addControlArrowsSingle('right');
		this.controlContainer.appendChild(this.arrowContainer.wrapper);
	}

	#addControlArrowsSingle(direction){
		let arrow = document.createElement('div');
		arrow.classList.add(`${this.#controlCssClasses.container.arrowContainer.arrow.name}-${direction}`);
		this.arrowContainer.wrapper.appendChild(arrow);
		return arrow;
	}

	resetDots(){
		SliderHelpers.clearInterval();
		this.dotContainer.querySelectorAll(`.${this.#controlCssClasses.container.dotContainer.dot.name}`).forEach((el,index) => {
			el.classList.remove('dot-active');
		});
	}

	setActiveDot(slide) {
		this.resetDots();
		if (this.#opts.controls.dotsCount==='fitRows') {
			slide = slide.filter(el => el%this.#opts.slidesPerRow===0).map(el => el/this.#opts.slidesPerRow);
		}
		slide.forEach(el => {
			document.querySelector(`.${this.#controlCssClasses.container.dotContainer.dot.name}[data-slide="${el}"]`).classList.add('dot-active');
		})
	}
}
