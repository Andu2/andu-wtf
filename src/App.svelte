<script>
	import { onMount } from "svelte";
	import { distortion, nextPlay } from "./store";

	let bg;

	let context = new (window.AudioContext || window.webkitAudioContext)();
	let analyser = context.createAnalyser();
	analyser.fftSize = 32;
	let freqData = new Uint8Array(analyser.frequencyBinCount);
	requestAnimationFrame(animateAudio)

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
	}

	function wtf(event) {
		let mediaElement = new Audio("sounds/wtf" + $nextPlay + ".mp3");
		let source = context.createMediaElementSource(mediaElement);
		let dist = context.createWaveShaper();
		let gain = context.createGain();

		source.connect(gain);
		gain.connect(dist);
		dist.connect(context.destination);

		gain.gain.value = 1;
		dist.curve = makeDistortionCurve($distortion);

		mediaElement.addEventListener("play", function(event) {
			nextPlay.set(($nextPlay % 8) + 1);
			distortion.set(Math.min($distortion * 1.1 + 5, 10000));
			randomColor();
		});
		mediaElement.play();
	}

	function animateAudio() {
		analyser.getByteTimeDomainData(freqData);
		let totalVolume = 0;
		freqData.forEach(function(volume) {
			totalVolume += volume;
		});
		//console.log(freqData)
		//console.log(totalVolume);
		requestAnimationFrame(animateAudio);
	}
</script>

<main>
	<div id="bg" bind:this={bg} on:click={wtf} ></div>
</main>

<style>
	div#bg {
		position: absolute;
		cursor: pointer;
		left: 0; right: 0; bottom: 0; top: 0;
	}
</style>

