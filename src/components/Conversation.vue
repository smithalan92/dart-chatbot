<template>
  <div class="w-96 flex flex-col absolute bottom-0 right-12 drop-shadow-md overflow-hidden">
    <div class="flex-1 bg-cyan-700 text-white p-3 rounded-t-md">
      Chat with Dart Bot
    </div>
    <div class="flex flex-col h-96 bg-gray-200 flex-col-reverse overflow-y-auto">
      <Message v-for="message in messages" :key="message.id" :message="message" />
      <div v-if="!messages.length" class="flex flex-col flex-1 items-center justify-center">
        <BotAvatar class="w-24 opacity-70"/>
        <span class="p-4 text-center">
          Hi! I'm <span class="font-bold">Dart Bot</span>. You can ask me for a list of stations,
          or trains at the name of a station.
        </span>
        <span class="mt-2 px-4 text-center text-gray-500">
          eg. Hey! Give me a list dart of stations
        </span>
        <span class="mt-2 px-4 text-center text-gray-500">
          eg. Hey! What are the train times in Dublin Connolly
        </span>
      </div>
    </div>
    <div class="flex-1 flex bg-gray-300 p-2">
      <input
        ref="textInput"
        class="flex-1 rounded py-1 px-2 outline-none"
        v-model="messageText"
        placeholder="Type your question here"
        @keydown.enter="send"
      />
      <div class="c-conversation__send" @click="send">
        <SendIcon class="c-conversation__send-icon w-6 rotate-90" />
      </div>
    </div>
  </div>
</template>
<script>
import { nextTick, onMounted, ref } from 'vue';
import Message from './Message.vue';
import SendIcon from '../assets/send.svg';
import BotAvatar from '../assets/bot.svg';
import useBotConversation from '../composables/useBotConversation';

export default {
  name: 'Conversation',

  components: {
    Message,
    SendIcon,
    BotAvatar,
  },

  setup() {
    const { messages, sendMessage } = useBotConversation();
    const textInput = ref(null);
    const messageText = ref('');

    const send = async () => {
      if (!messageText.value) return;
      sendMessage({ text: messageText.value, userType: 'user' });
      messageText.value = '';
      await nextTick();
      textInput.value?.focus();
    };

    onMounted(() => {
      textInput.value?.focus();
    });

    return {
      messages,
      messageText,
      textInput,
      send,
    };
  },
};
</script>
<style scoped>
.c-conversation__send {
  @apply p-2 flex items-center justify-center cursor-pointer;
}

.c-conversation__send-icon {
  @apply w-6 rotate-90;
}

.c-conversation__send:hover .c-conversation__send-icon {
  @apply opacity-60;
}
</style>
