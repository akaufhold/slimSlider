'use strict';

import WebFont from 'webfontloader';

export default class SliderWebfont {
	#fontFamily;
	#sliderContainer;

	constructor(fontFamily, sliderContainer) {
		this.#sliderContainer = sliderContainer;
		this.#fontFamily = fontFamily;
		this.#init();
		this.#addFontFamily();
	}

	#init() {
		WebFont.load({
			google: {
				families: this.#fontFamily
			}
		});
	};

	#addFontFamily() {
		let fontTag = this.#fontFamily.map(el => el.split(':')[0]);
		this.#sliderContainer.forEach(el => {
			el.style.fontFamily = '';
			el.style.fontFamily = fontTag;
		})
	}
}