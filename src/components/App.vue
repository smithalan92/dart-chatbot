<template>
  <div class="w-full h-full relative">
    <Conversation />
  </div>
</template>
<script>
import Conversation from './Conversation.vue';
import '../index.css';

export default {
  name: 'App',

  components: {
    Conversation,
  },
};
</script>
