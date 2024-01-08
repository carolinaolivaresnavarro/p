<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { SSE } from 'sse.js'

	let query: string = ''
	let answer: string = ''
	let loading: boolean = false
	let chatMessages: ChatCompletionRequestMessage[] = []
	let scrollToDiv: HTMLDivElement

	// Agrega las voces que quieras usar, tanto de hombre como de mujer.
	const voices = {
		
		female: 'Sabina Desktop - Español (España)'
	}

	function botMessage(message) {
  // Código para mostrar el mensaje en pantalla
  
  // Llamar a la función speakText para leer el mensaje en voz alta
     speakText(message, voices.female, 'es-MX');
	}



function speakText(text, voiceGender) {
	var chatbox = document.getElementById('chatbox');
    var lastMessage = '';

 setInterval(function() {
    var messages = chatbox.innerHTML;
    if (messages !== lastMessage) {
       var newMessage = messages.replace(lastMessage, '');
       speak(newMessage, voiceGender);
       lastMessage = messages;
  }
}, 1000);


    var audio = document.getElementById('tts-audio');
    var msg = new SpeechSynthesisUtterance(text);
	 msg.lang = 'es'; // Establece el idioma en español
    window.speechSynthesis.speak(msg);
    }

	function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}

	const handleSubmit = async () => {
		loading = true
		chatMessages = [...chatMessages, { role: 'user', content: query }]

		const eventSource = new SSE('/api/chat', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ messages: chatMessages })
		})
		const messageSound = document.getElementById('messageSound') as HTMLAudioElement;
        messageSound.currentTime = 0; // Reinicia el audio si ya se estaba reproduciendo
        messageSound.play();

		query = ''

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', (e) => {
			scrollToBottom()
			try {
				loading = false
				if (e.data === '[DONE]') {
					chatMessages = [...chatMessages, { role: 'assistant', content: answer }]
					answer = ''
					speakText(chatMessages[chatMessages.length - 1].content, voices.female); // Lee el último mensaje enviado con voz de mujer
					return
				}

				const completionResponse = JSON.parse(e.data)
				const [{ delta }] = completionResponse.choices

				if (delta.content) {
					answer = (answer ?? '') + delta.content
				}
			} catch (err) {
				handleError(err)
			}
		})
		eventSource.stream()
		scrollToBottom()
	}

	function handleError<T>(err: T) {
		loading = false
		query = ''
		answer = ''
		console.error(err)
	}
</script>

<div class="flex flex-col pt-4 w-full px-8 items-center gap-2">
	<div>
		<h1 class="text-xl font-bold w-full text-center bg-gradient-to-r text-transparent from-red-500 to-purple-500 bg-clip-text"> </h1>
		<p class="text-sm font-bold w-full text-center"></p>
	</div>
	<div class="h-[480px] w-4/2 bg-blue-900 rounded-md p-4 overflow-y-auto flex flex-col gap-4 desert-background">
		<div class="flex flex-col gap-2">
			<ChatMessage type="assistant" message="Hola soy Samantha, una Inteligencia Artificial que te quiere ayudar a aprender más de mecánica y electricidad con un juego interactivo. En el cual tus decisiones te llevarán a diferentes aventuras. Envíame un ESTOY LISTO para empezar nuestra aventura. Recuerda siempre que tengas duda en un término puedes escribirme." />
			{#each chatMessages as message}
				<ChatMessage type={message.role} message={message.content} />
			{/each}
			{#if answer}
				<ChatMessage type="assistant" message={answer} />
			{/if}
			{#if loading}
				<ChatMessage type="assistant" message="Pensando.." />
			{/if}
		</div>
		<div class="" bind:this={scrollToDiv} />
	</div>
	<form class="flex w-full rounded-md gap-4 bg-yellow-900 p-4" on:submit|preventDefault={() => handleSubmit()} style="background-image: url('src/madera.jpg'); background-repeat: repeat;">
	<input type="text" class="input input-bordered w-full" bind:value={query} />
	<span class="arrow-btn" on:click={() => handleSubmit()}>
		
		<span class="arrow arrow-large">➤</span>

	</span>
</form>

<style>

   .desert-background {
  background-image: url('src/desierto.jpg');
  background-repeat: repeat;
  background-size: cover;
}
     
	.arrow-btn {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: transparent;
	border: none;
	color: #fff;
	cursor: pointer;
	font-size: 1rem;
	padding: 0.5rem;
	
}

.arrow {
	color: gold;
	margin-left: 0.5rem;
	position: relative;
	transition: all 0.3s ease;
}

.arrow:before {
	content: "";
	position: absolute;
	top: -5px;
	left: -5px;
	bottom: -5px;
	right: -5px;
	background-size: cover;
	background-repeat: repeat;
	z-index: -1;
}

.arrow:hover {
	color: red;
	transform: scale(1.2);
}

.arrow:hover:before {
	animation: shine 1s ease-out;
}

@keyframes shine {
	from {
		opacity: 0;
		transform: rotateZ(0deg);
	}
	to {
		opacity: 1;
		transform: rotateZ(360deg);
	}
}

</style>

</div>
