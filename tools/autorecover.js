var fs = require('fs');
var colors = require('colors');
var datetime = require('node-datetime');
var request = require('request');
var shell = require('shelljs');

var path = __dirname.replace(/tools/g, '');

var ipAddresses = [];

var zeroFail = 10;
var oneFail = 10;
var twoFail = 10;

fs.readFile(`${path}provisioners/inventory-checkbox`, 'utf8', function (err, data) {
    if (err) console.log('Failed to read file\n\n', err, '\n');
    else {
        var lines = data.split('\n');
        for (let i = 1; i < lines.length; i++) {
            ipAddresses.push(lines[i].split(' ')[0]);
        }

        var intervalId = setInterval(function () {

            var output = '';

            request({ url: `http://${ipAddresses[0]}`, method: 'GET', timeout: 1000 }, function (error, response, body) {

                output += '\n------------------------\n';
                output += '------- ' + datetime.create().format('H:M:S').bold + ' -------\n';
                output += '------------------------\n'

                if (response && response.statusCode && response.statusCode === 200) {
                    output += `\n${ipAddresses[0]}: ` + '   UP   '.bgGreen + '\n';
                    zeroFail = 10;
                }
                else {
                    output += `\n${ipAddresses[0]}: ` + '  DOWN  '.bgRed + '\n';
                    zeroFail--;
                }

                request({ url: `http://${ipAddresses[1]}`, method: 'GET', timeout: 1000 }, function (error, response, body) {
                    if (response && response.statusCode && response.statusCode === 200) {
                        output += `\n${ipAddresses[1]}: ` + '   UP   '.bgGreen + '\n';
                        oneFail = 10;
                    }
                    else {
                        output += `\n${ipAddresses[1]}: ` + '  DOWN  '.bgRed + '\n';
                        oneFail--;
                    }

                    request({ url: `http://${ipAddresses[2]}`, method: 'GET', timeout: 1000 }, function (error, response, body) {
                        if (response && response.statusCode && response.statusCode === 200) {
                            output += `\n${ipAddresses[2]}: ` + '   UP   '.bgGreen + '\n';
                            twoFail = 10;
                        }
                        else {
                            output += `\n${ipAddresses[2]}: ` + '  DOWN  '.bgRed + '\n';
                            twoFail--;
                        }

                        console.log(output);

                        if (zeroFail === 0)
                        {
                            console.log('                               '.bgMagenta);
                            console.log('    Downtime limit reached.    '.bgMagenta);
                            console.log('    Deploying a new server.    '.bgMagenta);
                            console.log('                               '.bgMagenta);
                            console.log();
                            shell.exec(`sudo node ${path}provisioners/do-checkbox-one.js`);
                            clearInterval(intervalId);
                        }
                        else if (zeroFail !== 10)
                        {
                            console.log('Server at '.cyan + `${ipAddresses[0]}`.bold + ' unreachable; '.cyan + `${zeroFail}`.bold + ' attempts remain.'.cyan);
                        }

                        if (oneFail === 0)
                        {
                            console.log('                               '.bgMagenta);
                            console.log('    Downtime limit reached.    '.bgMagenta);
                            console.log('    Deploying a new server.    '.bgMagenta);
                            console.log('                               '.bgMagenta);
                            console.log();
                            shell.exec(`sudo node ${path}provisioners/do-checkbox-one.js`);
                            clearInterval(intervalId);
                        }
                        else if(oneFail !== 10)
                        {
                            console.log('Server at '.cyan + `${ipAddresses[1]}`.bold + ' unreachable; '.cyan + `${oneFail}`.bold + ' attempts remain.'.cyan);
                        }

                        if (twoFail === 0)
                        {
                            console.log('                               '.bgMagenta);
                            console.log('    Downtime limit reached.    '.bgMagenta);
                            console.log('    Deploying a new server.    '.bgMagenta);
                            console.log('                               '.bgMagenta);
                            console.log();
                            shell.exec(`sudo node ${path}provisioners/do-checkbox-one.js`);
                            clearInterval(intervalId);
                        }
                        else if(twoFail !== 10)
                        {
                            console.log('Server at '.cyan + `${ipAddresses[2]}`.bold + ' unreachable; '.cyan + `${twoFail}`.bold + ' attempts remain.'.cyan);
                        }
                    });
                });
            });
        }, 1000);
    }
});
