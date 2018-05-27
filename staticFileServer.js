const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.json': 'application/json',
    '.png': 'image/png',
};

function requestHandler (req, res) {
    console.info(`${req.method} ${req.url}`);
    const pathName = '.' + url.parse(req.url).pathname;

    fs.exists(pathName, function (exist) {
        if (!exist) {
            res.statusCode = 404;
            res.end('File not found: ' + pathName);
            return;
        }

        if (fs.statSync(pathName).isDirectory()) {
            res.statusCode = 403;
            res.end(pathName + ' is a directory');
            return;
        }

        fs.readFile(pathName, function(err, data){
            if (err){
                console.error(err);
                res.statusCode = 500;
                res.end('Server error');
            } else {
                const extension = path.parse(pathName).ext;

                res.setHeader('Content-type', mimeTypes[extension] || 'text/plain');
                res.statusCode = 200;
                res.end(data);
            }
        });
    });
}

const server = http.createServer(requestHandler);

server.start = (port = 3000) => {
    server.listen(port, (err) => {
        if (err) {
            console.error('cannot start server', err);
            return;
        }

        console.info(`\x1b[40m Static file Server server running http://localhost:${port} \x1b[0m`);
    });
};

module.exports = server;
