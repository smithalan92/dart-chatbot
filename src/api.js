/* eslint-disable no-param-reassign */
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser();

const PROXY_URL = 'https://urlproxy.mralansmith.com';

/**
 * Proxies the given get request due to GET issues on the irish rail api
 * @param {string} url
 * @param {object|null|undefined} params
 * @returns {Promise<object>}
 */
function getProxiedRequest(url, params) {
  const paramText = Object.keys(params ?? {}).reduce((text, key) => {
    const value = params[key];

    if (text) text += `&${key}=${value}`;
    else text = `?${key}=${value}`;

    return text;
  }, '');

  return axios.get(`${PROXY_URL}/json?url=${url}${paramText}`);
}

/**
 * Gets a list of dart stations
 * @returns {Promise<string[]>}
 */
async function getDartStations() {
  const { data } = await getProxiedRequest('http://api.irishrail.ie/realtime/realtime.asmx/getAllStationsXML_WithStationType', {
    StationType: 'D',
  });

  const stationData = xmlParser.parse(data);

  return stationData.ArrayOfObjStation.objStation.map(({ StationDesc }) => StationDesc);
}

/**
 * Gets the next X trains departing the given dart station
 * @param {number|null|undefined} trainLimit
 * @param {string} stationName
 * @returns {Promise<object[]>}
 */
async function getNextTrainsForStation({ trainLimit, stationName }) {
  const { data } = await getProxiedRequest('https://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML', {
    StationDesc: stationName,
  });

  const trainData = xmlParser.parse(data);

  if (!trainData?.ArrayOfObjStationData?.objStationData) return [];

  // Looks like a lot, but we need to filter train types, and make sure the departure date
  // is after the current date, I've seen the API return trains that previously departed.
  // We also need to sort the array to make sure the closest departing trains are at the start
  // and then slice based on the station limit since you can't limit/sort on the api itself it seems
  return trainData.ArrayOfObjStationData.objStationData
    .filter(({ Traintype, Expdepart, Traindate }) => Traintype === 'DART' && new Date(`${Traindate} ${Expdepart}`) > new Date())
    .map(({
      Expdepart, Direction, Traindate, Duein,
    }) => ({
      departDateTime: new Date(`${Traindate} ${Expdepart}`),
      direction: Direction,
      dueInMinutes: Duein,
    }))
    .sort((a, b) => a.departDateTime - b.departDateTime)
    .slice(0, trainLimit);
}

export default {
  getDartStations,
  getNextTrainsForStation,
};
