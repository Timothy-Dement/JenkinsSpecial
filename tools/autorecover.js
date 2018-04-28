var fs = require('fs');
var colors = require('colors');
var datetime = require('node-datetime');
var request = require('request');

var path = __dirname.replace(/tools/g, '');

var ipAddresses = [];

fs.readFile(`${path}provisioners/inventory-checkbox`, 'utf8', function (err, data) {
    if (err) console.log('Failed to read file\n\n', err, '\n');
    else {
        var lines = data.split('\n');
        for (let i = 1; i < lines.length; i++) {
            ipAddresses.push(lines[i].split(' ')[0]);
        }

        setInterval(function () {

            var output = '';

            request({ url: `http://${ipAddresses[0]}`, method: 'GET', timeout: 1000 }, function (error, response, body) {

                output += '\n------------------------\n';
                output += '------- ' + datetime.create().format('H:M:S').bold + ' -------\n';
                output += '------------------------\n'

                if (response && response.statusCode && response.statusCode === 200) {
                    output += `\n${ipAddresses[0]}: ` + '   UP   '.bgGreen + '\n';
                }
                else {
                    output += `\n${ipAddresses[0]}: ` + '  DOWN  '.bgRed + '\n';
                }

                request({ url: `http://${ipAddresses[1]}`, method: 'GET', timeout: 1000 }, function (error, response, body) {
                    if (response && response.statusCode && response.statusCode === 200) {
                        output += `\n${ipAddresses[1]}: ` + '   UP   '.bgGreen + '\n';
                    }
                    else {
                        output += `\n${ipAddresses[1]}: ` + '  DOWN  '.bgRed + '\n';
                    }

                    request({ url: `http://${ipAddresses[2]}`, method: 'GET', timeout: 1000}, function (error, response, body) {
                        if (response && response.statusCode && response.statusCode === 200) {
                            output += `\n${ipAddresses[2]}: ` + '   UP   '.bgGreen + '\n';
                        }
                        else {
                            output += `\n${ipAddresses[2]}: ` + '  DOWN  '.bgRed + '\n';
                        }
                        console.log(output);
                    });
                });
            });
        }, 5000);
    }
});
