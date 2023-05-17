const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const utils = require('./utils');
const { textToSpeech } = require('./azure-cognitiveservices-speech');

// fn to create express server
const create = async () => {

    // server
    const app = express();
    app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
    
    // Register ejs as .html
    app.engine('.html', require('ejs').__express);
    //app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'html');

    // Log request
    app.use(utils.appLogger);

    // creates a temp file on server, the streams to client
    /* eslint-disable no-unused-vars */
    app.get('/text-to-speech', async (req, res, next) => {
        
        const { key, region, language, phrase, file } = req.query;

        var errors = res.errors = [];
        
        if (!key || !region || !language || !phrase) {
            //return res.status(404).send('Invalid query string');
            return errors[errors.length] = 'Invalid query string';
        }

        let fileName = null;
        
        // stream from file or memory
        if (file && file === true) {
            fileName = `./temp/stream-from-file-${timeStamp()}.mp3`;
        }
        
        try{
            const audioStream = await textToSpeech(key, region, language, phrase, fileName);
            res.set({
                'Content-Type': 'audio/mpeg',
                'Transfer-Encoding': 'chunked'
            });
            audioStream.pipe(res);

        } catch (err) {
            return res.status(404).send('Invalid parameter');
        }
    });

    // root route - serve static file
    app.get('/api/hello', (req, res) => {
        res.json({hello: 'goodbye'});
        res.end();
    });

    // root route - serve static file
    app.get('/', (req, res) => {
        //return res.sendFile(path.join(__dirname, '../public/client.html'));
        return res.render('../public/client.html');
    });

    // Catch errors
    app.use(utils.logErrors);
    app.use(utils.clientError404Handler);
    app.use(utils.clientError500Handler);
    app.use(utils.errorHandler);

    return app;
};

module.exports = {
    create
};
