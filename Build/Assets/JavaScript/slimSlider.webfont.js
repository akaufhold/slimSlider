'use strict';

import WebFont from 'webfontloader';

export default class SliderWebfont {
	#fontFamily;

	constructor(fontFamily) {
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
		console.log(this.#fontFamily);
		let fontTag = this.#fontFamily.map(el => el.split(':')[0]);
		document.body.style.fontFamily = fontTag;
	}
}