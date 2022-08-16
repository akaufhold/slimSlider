import SliderHelpers from './slimSlider.helpers';

export default class SliderLoader {
	images;
	imgLoaded;
	
	constructor(images){
		return (async () => {
			this.images = images;
			this.imgLoaded = await this.init();
			return this;
		})();
	}

 	async init(){
		try {
			return await this.#loadAllImages();
		} catch(error) {
			new Error(`Image loader init failed with ${error}`); 
		} 
	}

	#loadAllImages() {
		try{
			if (!this.imgsLoaded) {
				/*typeof this.images=='object' && this.images.map(el => Object.assign(el.getAttribute('src')));*/
				//console.log(await Promise.all(this.images.map(async image => await this.#loadSingleImage(image))));
				return Promise.all(this.images.map(async image => await this.#loadSingleImage(image)));

			}	else {
				// console.log(this.imgsLoaded);
				return Promise.resolve();
			}
		}catch(error) {
			new Error(`Image loading failed > ${error}`); 
		}
	};

	#loadSingleImage(path) {
		try {
			return this.#createImage(path);
		}
		catch(err){
			console.error(err)
		}
	};

	async #createImage(path) {
		return new Promise(function(res,rej) {
			let image;
			if (typeof path==='string') {
				image = document.createElement('img');
				image.src = path;
			} else {
				image = Object.assign(path);
			}
			image.addEventListener('load', () => res(image), false);
			image.addEventListener('error', () => rej(new Error(`Failed to load img > ${image.src}`)), false);
			image.dispatchEvent(new Event('load'));
		});
	}
}