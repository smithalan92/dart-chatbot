<template>
  <div class="w-full flex px-2 py-3 border-b border-sold border-gray-300">
    <div class="flex flex-col items-center">
      <component :is="messageAvatar" class="w-10 rounded" />
    </div>
    <div class="flex flex-1 flex-col ml-2">
      <div class="flex items-center" >
        <span class="font-semibold text-lg">{{ messageSender }}</span>
        <span class="text-gray-400 ml-2">{{ messageDateTime }} </span>
      </div>
      <div class="mt-1">
        <div v-html="messageText" v-if="isMessageFromBot" />
        <div v-else>{{ messageText }}</div>
      </div>
    </div>
  </div>
</template>
<script>
import { computed, toRefs } from 'vue';
import { format } from 'date-fns';
import BotAvatar from '../assets/bot.svg';
import UserAvatar from '../assets/user.svg';

export default {
  name: 'Message',

  props: {
    message: {
      type: Object,
      required: true,
    },
  },

  setup(props) {
    const { message } = toRefs(props);
    const messageDateTime = computed(() => format(message.value.createdDateTime, 'HH:mm'));

    const isMessageFromBot = computed(() => message.value.userType === 'bot');

    const messageSender = computed(() => (isMessageFromBot.value ? 'Dart Bot' : 'You'));

    const messageAvatar = computed(() => {
      if (isMessageFromBot.value) return BotAvatar;
      return UserAvatar;
    });

    return {
      isMessageFromBot,
      messageText: message.value.text,
      messageDateTime,
      messageSender,
      messageAvatar,
    };
  },
};
</script>
