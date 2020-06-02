const express       = require('express');
const http          = require('http');
const path          = require('path');
const process       = require('child_process');
const bodyParser    = require('body-parser');
const Proxy         = require('../../lib/proxy');
const createSession = require('./create-session');

const PROXY_PORT_1 = 1401;
const PROXY_PORT_2 = 1402;
const SERVER_PORT  = 1400;


function prepareUrl (url) {
    if (!/^(?:file|https?):\/\//.test(url)) {
        const matches = url.match(/^([A-Za-z]:)?(\/|\\)/);

        if (matches && matches[0].length === 1)
            url = 'file://' + url;
        else if (matches && matches[0].length > 1)
            url = 'file:///' + url;
        else
            url = 'http://' + url;
    }

    return url;
}

exports.start = sslOptions => {
    const app       = express();
    const appServer = http.createServer(app);

    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'views/index.html'));
    });

    app.post('*', (req, res) => {
        let url = req.body.url;
        let currentURL = req.body.currentURL;
        
        try {
            const proxy     = new Proxy(currentURL, PROXY_PORT_1, PROXY_PORT_2, {
                ssl:             sslOptions,
                developmentMode: true
            });      
        } catch (error) {
            console.warn(error)
        } // where is the unique id generarion stuff? nvm i found it 



        if (!url) {
            res
                .status(403)
                .sendFile(path.resolve(__dirname, 'views/403.html'));
        }
        else {
            url = prepareUrl(url);
            res
                .status(301)
                .set('location', proxy.openSession(url, createSession()))
                .end();
        }
    });

    appServer.listen(SERVER_PORT);
    console.log('Server listens on port ' + SERVER_PORT);
};
