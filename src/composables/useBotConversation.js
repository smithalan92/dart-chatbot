/* eslint-disable no-restricted-syntax */
import { ref, watch, computed } from 'vue';
import format from 'date-fns/format';
import api from '../api';

// We'll match these phrases to get a list of stations.
// Most advanced NLP you'll ever see :)
const STATION_PHRASES = [
  'list stations',
  'station list',
  'station names',
  'dart stations',
];

// Match these phrases to get train times
const TRAIN_TIME_PHRASES = [
  'train times',
  'time of trains',
  'next trains',
  'times at',
];

// This will act as a cache for dart stations
// as we use them to verify a station exists before
// getting a train time as well
let STATION_LIST = [];

/**
 * Returns true if the given text contains one of the given phrases
 * @param {string} text
 * @param {string[]} phraseList
 * @returns {boolean}
 */
function containsPhrase(text, phraseList) {
  for (const phrase of phraseList) {
    if (text.includes(phrase)) return true;
  }

  return false;
}

/**
 * Gets a response from the bot for a message
 * @param {string} messageText
 * @returns {string}
 */
async function getBotResponseForMessage(messageText) {
  const text = messageText.toLowerCase();

  // Check for list station command
  if (containsPhrase(text, STATION_PHRASES)) {
    if (!STATION_LIST.length) {
      STATION_LIST = await api.getDartStations();
    }

    return `
      Here is the list of DART stations you asked for 😃\n
      <ul class="list-decimal ml-4">
       ${STATION_LIST.map((station) => `<li>${station}</li>`).join('\n')}
      </ul>
    `;
  }

  // Check for train time command
  if (containsPhrase(text, TRAIN_TIME_PHRASES)) {
    if (!STATION_LIST.length) {
      STATION_LIST = await api.getDartStations();
    }

    const requestedStation = STATION_LIST.find((stationName) => new RegExp(`${stationName}`, 'im').test(text));

    if (!requestedStation) return "Sorry, we couldn't find a station based on your message";

    const nextTrains = await api.getNextTrainsForStation({
      trainLimit: 2,
      stationName: requestedStation,
    });

    if (!nextTrains.length) return `No trains are scheduled to depart ${requestedStation}`;

    const trainMarkup = nextTrains.map(({ departDateTime, direction, dueInMinutes }) => {
      const time = format(departDateTime, 'HH:mm');
      const dueInHours = Math.floor(dueInMinutes / 60);
      const dueInMin = dueInMinutes % 60;

      // Add the due in x hrs/minutes texts if we have it
      let dueInText = '';
      if (dueInMin || dueInHours > 0) {
        dueInText += 'due in';
        if (dueInHours > 0) dueInText += ` ${dueInHours} hr`;
        if (dueInMin > 0) dueInText += ` ${dueInMin} min`;
      }

      return `<li>${direction}: ${dueInText}${dueInText.length ? ', ' : ''}departing at ${time}</li>`;
    });

    return `
      Here are the next trains departing from ${requestedStation} 😃\n
      <ul class="list-disc ml-4">${trainMarkup.join('\n')}</ul>
    `;
  }

  return "Sorry, I don't know how to answer that";
}

/**
 * Composable. Returns state & functions to have a bot conversation
 * @returns {object}
 */
export default function useBotConversation() {
  const messages = ref([]);

  // We always want to sort the messages from oldest to newest to display correctly in the UI
  const orderedMessages = computed(() => {
    return messages.value.sort((a, b) => new Date(b.createdDateTime) - new Date(a.createdDateTime));
  });

  const sendMessage = ({ text, userType }) => {
    messages.value.push({
      id: new Date().getTime(),
      createdDateTime: new Date(),
      userType,
      text,
    });
  };

  // Watch the messages. When a new one gets added, we'll see if the bot
  // needs to respond
  watch(() => orderedMessages.value.length, async () => {
    const latestMessage = orderedMessages.value[0];
    if (latestMessage?.userType === 'user') {
      const botResponse = await getBotResponseForMessage(latestMessage.text);
      sendMessage({ text: botResponse, userType: 'bot' });
    }
  }, { deep: true });

  return {
    messages: orderedMessages,
    sendMessage,
  };
}
