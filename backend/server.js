require('dotenv').config();
const express = require('express');
const mqtt = require('mqtt');
const axios = require('axios');
const cors = require('cors');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ server });

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const key = process.env.GOOGLEMAPS_API;

app.get('/maps-api-url', (req, res) => {
    const url = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly`;
    res.json({ url });
});

const TOPICS = ['sensor/temperature', 'sensor/humidity', 'sensor/distance', 'sensor/heartRate','sensor/blood'];
let latestValues = {};

const client = mqtt.connect('mqtt://165.22.122.17');

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    TOPICS.forEach(topic => client.subscribe(topic));
});

client.on('message', async (topic, message) => {
    const value = message.toString();
    latestValues[topic] = value;
    console.log(`Received ${topic}: ${value}`);
});

wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ topic, value }));
    }
});

app.get('/values', (req, res) => {
    res.json(latestValues);
});

app.listen(PORT, () => console.log('Backend running on port ${PORT}'));

wss.on('connection', ws => {
  console.log('WebSocket client connected');

   ws.send(JSON.stringify(latestValues));
});