import Slider from './slimSlider';
import SliderWebfont from "./slimSlider.webfont";

export default class SliderResponsive {
	#sliders = [];
	#sliderCssClass;
	#sliderSelector;
	viewportWidth;
	#breakpoints;
	#defaultOptions;
	#opts;

	constructor(
		options,
		sliderCssClass = `.${options.sliderClass}`
	){
		this.#opts = Object.assign({}, options);
		this.#defaultOptions = Object.assign({}, options);
		this.#sliderCssClass = sliderCssClass;
		this.#sliderSelector = document.querySelectorAll(sliderCssClass);
		this.init();
	}

	init() {
		new SliderWebfont(this.#opts.fontFamily,this.#sliderSelector);
		this.#setViewport();
		this.#getBreakpoints();
		this.#setViewportOptions();
		this.#initAllSliders();
		window.addEventListener('resize',this.reinitAllSliders.bind(this), true);
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
		} else {
			this.#opts = Object.assign({}, this.#defaultOptions);
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

	#initAllSliders() {
		this.#sliderSelector.forEach(sliderElement => {
			this.#sliders.push(new Slider(sliderElement,this.#opts));
		});
	}

	reinitAllSliders() {
		this.#setViewport();
		this.#setViewportOptions();
		this.#sliders.forEach(slider => {
			slider.setOptions(this.#opts);
			slider.init();
		})
	}
}  