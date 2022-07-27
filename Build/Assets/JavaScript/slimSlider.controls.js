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
		this.setActiveDot([...Array(this.#opts.slidesPerRow).keys()]); 
			//this.setActiveDot([0]);
	}

	#addControlDots() {
		this.dotContainer = document.createElement('div');
		this.dotContainer.classList.add(this.#controlCssClasses.container.dotContainer.name);
		this.#sliderElements.forEach((_,index) => {
			this.dotContainer.insertAdjacentHTML('beforeEnd',`<div class="${this.#controlCssClasses.container.dotContainer.dot.name}" data-slide="${index}"></div>`);
		});
		this.controlContainer.appendChild(this.dotContainer);
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
		//console.log(this.#controlCssClasses.container.dotContainer.dot.name);
		this.dotContainer.querySelectorAll(`.${this.#controlCssClasses.container.dotContainer.dot.name}`).forEach((el,index) => {
			el.classList.remove('dot-active');
		});
	}

	setActiveDot(slide) {
		this.resetDots();
		slide.forEach(el => {
			document.querySelector(`.${this.#controlCssClasses.container.dotContainer.dot.name}[data-slide="${el}"]`).classList.add('dot-active')
		})
	}
}
