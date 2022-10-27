import SliderHelpers from './slimSlider.helpers';

export default class SliderUI {
	#sliderContainer;
	#sliderWrapper;
	#sliderElements;

	controlContainer = false;
	dotContainer = false;
	arrowContainer = false;

	#controlCssClasses = {
		container: {
			name: 'slider-ui',
			dotContainer: {
				name: 'slider-ui-dots',
				dot: {
					name: 'slider-ui-dot'
				}
			},
			arrowContainer: {
				name: 'slider-ui-arrows',
				arrow: {
					name: 'slider-ui-arrow'
				}
			},
			progress: {
				name: 'slider-ui-progress-wrapper',
				progressBar: {
					name: 'slider-ui-progress-bar'
				}
			},
			numbers: {
				name: 'slider-ui-number-wrapper',
				curIndex: {
					name: 'slider-ui-number-cur'
				},
				maxIndex: {
					name: 'slider-ui-number-max'
				},
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
		this.#opts.controls.direction && this.controlContainer.classList.add(this.#opts.controls.direction);
		this.#opts.controls.arrows && this.#addUIArrows();
		this.#opts.controls.dots && this.#addUIDots();
		this.#opts.controls.progressBar && this.#addProgressBar();
		this.#opts.controls.numbers && this.#addNumbers();
		this.#sliderContainer.appendChild(this.controlContainer);
		this.#opts.controls.dots && this.setActiveDot(this.#opts.controls.dotsCount==='fitRows'?[0]:[...Array(this.#opts.slidesShow).keys()]); 
	}

	#addUIArrows() {
		this.arrowContainer = {}
		this.arrowContainer.wrapper = document.createElement('div');
		SliderHelpers.setElClass(this.arrowContainer.wrapper,this.#controlCssClasses.container.arrowContainer.name);
		this.arrowContainer.sliderButtonLeft = this.#addUIArrowsSingle('left');
		this.arrowContainer.sliderButtonRight = this.#addUIArrowsSingle('right');
		this.controlContainer.appendChild(this.arrowContainer.wrapper);
	}

	#addUIArrowsSingle(direction){
		let arrow = document.createElement('div');
		arrow.classList.add(`${this.#controlCssClasses.container.arrowContainer.arrow.name}`,`${this.#controlCssClasses.container.arrowContainer.arrow.name}-${direction}`);
		arrow.setAttribute('role', 'button');
		arrow.setAttribute('tabindex', '0');
		this.arrowContainer.wrapper.appendChild(arrow);
		return arrow;
	}

	#addUIDots() {
		let elementsArray = this.#sliderElements;
		this.dotContainer = document.createElement('div');
		this.dotContainer.classList.add(this.#controlCssClasses.container.dotContainer.name);
		(this.#opts.controls.dotsCount === 'fitRows') && (elementsArray = this.#addUIDotsArray(this.#sliderElements.slice()));
		elementsArray.forEach((_,index) => {
			this.dotContainer.insertAdjacentHTML('beforeEnd',`<div class="${this.#controlCssClasses.container.dotContainer.dot.name}" data-slide="${index}" tabindex="${index++}" role="button"></div>`);
		});
		this.controlContainer.appendChild(this.dotContainer);
	}

	#addUIDotsArray(controlArray) {
		return controlArray.filter((_,index) => {
			let controlIndex = (index+1) * this.#opts.slidesShow;
			return this.#sliderElements[controlIndex-1]!==undefined;
		})
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
			slide = slide.filter(el => el%this.#opts.slidesShow===0).map(el => el/this.#opts.slidesShow);
		}
		slide.forEach(el => {
			document.querySelector(`.${this.#controlCssClasses.container.dotContainer.dot.name}[data-slide="${el}"]`).classList.add('dot-active');
		})
	}

	#addProgressBar() {
		this.controlContainer.insertAdjacentHTML('beforeEnd',`<div class="${this.#controlCssClasses.container.progress.name}"><div class="${this.#controlCssClasses.container.progress.progressBar.name}" style="animation-duration: ${this.#opts.delay}s"></div></div>`);
	}

	#addNumbers() {
		this.controlContainer.insertAdjacentHTML('beforeEnd',`<div class="${this.#controlCssClasses.container.numbers.name}"><div class="${this.#controlCssClasses.container.numbers.curIndex.name}"></div><div class="${this.#controlCssClasses.container.numbers.maxIndex.name}"></div></div>`);
	}

}
