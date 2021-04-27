<script>
	import { onMount } from "svelte";
	import { nextPlay } from "./store";

	let bg;
	let context;
	let analyser;
	let freqData;
	let circle;
	let text;
	let playingCount = 0;
	let distortion = 0;

	const isClient = typeof window !== "undefined";

	onMount(function() {
		randomColor();
	});

	// https://medium.com/@alexanderleon/web-audio-series-part-2-designing-distortion-using-javascript-and-the-web-audio-api-446301565541
	function makeDistortionCurve(amount) {
		let k = amount;
		let n_samples = typeof sampleRate === 'number' ? sampleRate : 44100;
		let curve = new Float32Array(n_samples);
		let deg = Math.PI / 180;
		let i = 0;
		let x;
		for ( ; i < n_samples; ++i ) {
		    x = i * 2 / n_samples - 1;
		    curve[i] = (3 + k)*Math.atan(Math.sinh(x*0.25)*5) / (Math.PI + k * Math.abs(x));
		}
		return curve;
	}

	function randomColor() {
		let red = Math.floor(Math.random() * 256);
		let green = Math.floor(Math.random() * 256);
		let blue = Math.floor(Math.random() * 256);
		bg.style.backgroundColor = "rgb(" + red + "," + green + "," + blue + ")";
		if (red + blue + green < 127 * 3) {
			circle.style.backgroundColor = "rgb(" + ((255 - red) / 2 + red) + "," + ((255 - green) / 2 + green) + "," + ((255 - blue) / 2 + blue) + ")"
		}
		else {
			circle.style.backgroundColor = "rgb(" + (red / 2) + "," + (green / 2) + "," + (blue / 2) + ")"
		}
	}

	function wtf(event) {
		if (context === undefined) {
			context = new (window.AudioContext || window.webkitAudioContext)();
			analyser = context.createAnalyser();
			analyser.fftSize = 32;
			freqData = new Uint8Array(analyser.frequencyBinCount);
		}
		fetch("sounds/wtf" + $nextPlay + ".mp3")
			.then(function(data) { return data.arrayBuffer() })
			.then(function(arrayBuffer) { return context.decodeAudioData(arrayBuffer) })
			.then(function(audio) {
				let source = context.createBufferSource();
				source.buffer = audio;
				let dist = context.createWaveShaper();
				let gain = context.createGain();

				source.onended = function(event) {
					playingCount--;
					playingCount = Math.max(0, playingCount);
				}

				source.connect(gain);
				source.connect(analyser);
				gain.connect(dist);
				dist.connect(context.destination);

				gain.gain.value = 1;
				dist.curve = makeDistortionCurve(distortion);

				source.start(context.currentTime);
				playingCount++;

				nextPlay.set(($nextPlay % 8) + 1);
				let newDistortion = Math.min(distortion * 1.1 + 5, 10000);
				distortion = newDistortion;
				text.style.fontSize = Math.sqrt(newDistortion) * 5 + "px";
				randomColor();

				requestAnimationFrame(animateAudio)
			});
	}

	let prevWidth = 0.1;
	let prevHeight = 0.1;

	function animateAudio() {
		if (playingCount > 0) {
			analyser.getByteTimeDomainData(freqData);
			let totalVolume = 0;
			let freqBalance = 0;
			freqData.forEach(function(volume, i) {
				let absVol = Math.abs(volume - 128);
				totalVolume += absVol;
				freqBalance += (i - 4) * absVol;
			});
			let pctVolume = Math.log(totalVolume / (128 * 4) + 1)
			let hStretch = Math.pow(2, freqBalance / (128 * 4));
			let width = Math.min(pctVolume * hStretch, 1);
			let height = Math.min(pctVolume / hStretch * 2, 1);
			width = (width + prevWidth) / 2
			height = (height + prevHeight) / 2
			console.log(pctVolume, hStretch);
			circle.style.width = (width * 100) + "%";
			circle.style.height = (height * 100) + "%";
			prevWidth = width;
			prevHeight = height;
			requestAnimationFrame(animateAudio);
		}
		else {
			circle.style.width = "0%";
			circle.style.height = "0%";
			text.style.fontSize = "0px";
		}
	}
</script>

<main>
	<div id="bg" bind:this={bg} on:click={wtf} >
		<div id="circle" bind:this={circle}></div>
		<div id="text" bind:this={text}>wtf</div>
	</div>
</main>

<style>
	div#bg {
		position: absolute;
		cursor: pointer;
		left: 0; right: 0; bottom: 0; top: 0;
	}

	div#circle {
		border-radius: 50%;
		position: absolute;
		overflow: visible;
		top: 0; left: 0; right: 0; bottom: 0;
		width: 10%;
		height: 10%;
		margin: auto;
	}

	div#text {
		position: absolute;
		width: 100%;
		height: 400px;
		line-height: 400px;
		text-align: center;
		top: 0; left: 0; right: 0; bottom: 0;
		margin: auto;
		font-family: sans-serif;
		font-weight: bold;
		font-size: 10pt;

		background-image: repeating-linear-gradient(to left, lightgreen, skyblue, royalblue, navy, darkslateblue, rebeccapurple, crimson, deeppink, pink);
		background-size: 200% 100%;
		background-clip: text;
		text-fill-color: transparent;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: important 4s ease infinite; 

		user-select: none;                      
	}

	@keyframes important {
		0% {background-position: 0% 0%}
		50% {background-position: 100% 0%}
		100% {background-position: 0% 0%}
	}
</style>

