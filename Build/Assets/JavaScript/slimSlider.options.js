let options = {
	autoplay: true,
	colorTheme:'yellow',
	controls: {
		arrows: true,
		direction: 'horizontal',
		dots: true,
		keys: true,
		dotsCount: 'fitRows', /* fitRows or all/empty */
		events: true
	},
	events: {
		touch: {
			threshold: 100
		}
	},
	delay: 6,
	elementWrapperClass:'slider-image-wrapper',
	elementType:'picture',
	elementClass:'slider-image',
	elementOverlayStyle:'rect',
	fontFamily: false,
	headerTag: 'h3',
	loop: true, 
	margin: 0,
	progressBar: true,
	slidesShow: 1,
	slidesPerColumn: 1,
	slidesRowWrap: false,
	sliderClass:"slider",
	sliderWrapperClass: "slider-wrapper",
	transition: 'rect', /* fade, slide or rotate */
	transitionTiming: 'ease-out',
	transitionSegments: 10,
	transitionDuration: 1200,
	type: 'slider', /* slider or gallery */
	vignette: false,
	zoom: true
}

let transitions = {
	fade: 'opacity',
	slide: 'transform',
	rotate: 'transform',
	clip: 'clip',
	blur: 'transform',
	circle: 'stroke-width',
	rect: 'stroke-width',
	slices: 'transform',
	tiles: 'transform',
	'tiles-rotate': 'transform',
	shutter: 'transform',
}

export {options, transitions};