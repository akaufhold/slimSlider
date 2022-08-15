import Slider from './slimSlider';

export default class SliderResponsive {
	#sliders = [];
	#sliderCssClass;
	#sliderSelector;
	viewportWidth;
	#breakpoints;
	#opts;

	constructor(
		options,
		sliderCssClass = `.${options.sliderClass}`
	){
		for (const option of Object.entries(options)) {
			this.#opts = options;
		}
		this.#sliderCssClass = sliderCssClass;
		this.#sliderSelector = document.querySelectorAll(sliderCssClass);
		this.init();
	}

	init() {
		this.#setViewport();
		this.#getBreakpoints();
		this.#initSlider();
		window.addEventListener('resize',this.reInitSlider.bind(this), true);
	}

	#setViewport() {
		this.viewportWidth = window.innerWidth || document.documentElement.clientWidth;
	}

	#getBreakpoints() {
		const {responsive} = this.#opts;
		this.#breakpoints = responsive.map(el => el.breakpoint);
	}


	#setViewportOptions() {
		let viewportOptions = this.#getOverrideOptionsForViewport();
		let overrideOptions = viewportOptions[0]?.options;
		if (overrideOptions) {
			for (const option of Object.entries(overrideOptions)) {
				this.#opts[option[0]] = option[1];
			}
		}
	}

	#getOverrideOptionsForViewport() {
		let viewportOptions;
		let minViewport=0;
		let target = this.#breakpoints.filter(el => el > this.viewportWidth);
		if (target.length){
			minViewport = target.reduce((last,next) => Math.min(last, next));
		}
		target && (viewportOptions = this.#opts.responsive.filter(el => {
			return el.breakpoint === minViewport;
		}));
		return viewportOptions;
	}

	#initSlider() {
		this.#sliderSelector.forEach(sliderElement => {
			this.#sliders.push(new Slider(sliderElement,this.#opts));
		});
	}

	reInitSlider() {
		this.#setViewport();
		this.#setViewportOptions();
		this.#sliders.forEach(slider => {
			slider.init();
		})
	}
}