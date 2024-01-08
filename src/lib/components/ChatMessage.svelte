<script lang="ts">
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai'
	export let type: ChatCompletionRequestMessageRoleEnum
	export let message: string
</script>

<div class="chat {type === 'user' ? 'chat-end' : 'chat-start'} justify-end">
	<div class="chat-image avatar">
		<div class="w-9 h-9 rounded-full" style="background-image: url('src/img/{type === 'user' ? 'user-avatar.svg' : 'bot-avatar.svg'}')">
		</div>
	</div>
	<div class="chat-header">
		{type === 'user' ? '' : ''}
	</div>
	<div class="chat-bubble {type === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
		{message}
	</div>
</div>



