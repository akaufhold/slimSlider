import WebFont from 'webfontloader';

export default class SliderWebfont {
	constructor() {
		this.#init();
	}

	#init() {
		WebFont.load({
			google: {
				families: ['Titillium Web:300,400,700', 'sans-serif']
			}
		});
	};
}