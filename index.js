const express = require('express');
const bodyParser = require('body-parser');
const server = express();

const bot_apis = require('./bot_apis');
const web_cron  = require('./web_scrapping_cron');


server.use(bodyParser.urlencoded({
    extended: true
}));

server.use(bodyParser.json());

bot_apis.load_apis(server);

web_cron.scrapping_cron_job.start();

server.listen((process.env.PORT || 8000), function () {
    console.log("Server is up and running...");
});

module.exports = server;