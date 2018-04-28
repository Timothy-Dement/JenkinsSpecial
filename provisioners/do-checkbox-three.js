
//////////////////////////////////////////
//                                      //
//    Digital Ocean Provisioner [x3]    //
//    Timothy Dement                    //
//    SUN MAY 06 2018                   //
//                                      //
//////////////////////////////////////////

var fs = require('fs');
var shell = require('shelljs');
var request = require('request');

var token = process.env.DIGITAL_OCEAN_TOKEN;

var url = 'https://api.digitalocean.com/v2/';

var headers =
    {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };

var checkboxKeyId;

shell.exec(`ssh-keygen -t rsa -f "${__dirname}/do-checkbox.key" -q -N ""`);

fs.readFile(`${__dirname}/do-checkbox.key.pub`, 'utf8', function (err, publicKey) {
    if (err) console.log('\nFailed to read key file\n\n', err, '\n');
    else {
        console.log('\nSuccessfully read key file\n');

        var createKeyOptions =
            {
                url: url + 'account/keys',
                method: 'POST',
                headers: headers,
                json:
                    {
                        'name': 'Checkbox Key',
                        'public_key': publicKey
                    }
            };

        request(createKeyOptions, function (error, response, body) {
            if (error) console.log('Failed to create key\n\n', error, '\n');
            else {
                console.log('Successfully created key\n');

                checkboxKeyId = body.ssh_key.id;

                var createDropletsOptions =
                    {
                        url: url + 'droplets',
                        method: 'POST',
                        headers: headers,
                        json:
                            {
                                'names': [`Checkbox-${new Date().getTime()}`, `Checkbox-${new Date().getTime() + 1}`, `Checkbox-${new Date().getTime() + 2}`],
                                'region': 'nyc1',
                                'size': 's-2vcpu-4gb',
                                'image': 'ubuntu-16-04-x64',
                                'ssh_keys': [checkboxKeyId],
                                'tags': ['checkbox']
                            }
                    };

                request(createDropletsOptions, function (error, response, body) {
                    if (error) console.log('Failed to create droplets\n\n', error, '\n');
                    else {
                        console.log('Successfully created droplets\n');

                        console.log('Pausing for 30 seconds...\n');

                        setTimeout(function () {
                            var listDropletsOptions =
                                {
                                    url: url + 'droplets?tag_name=checkbox',
                                    method: 'GET',
                                    headers: headers
                                };

                            request(listDropletsOptions, function (error, response, body) {
                                if (error) console.log('Failed to list droplets\n\n', error, '\n');
                                else {
                                    console.log('Successfully listed droplets\n');

                                    var checkboxIpAddresses = [];

                                    checkboxIpAddresses[0] = JSON.parse(body).droplets[0].networks.v4[0].ip_address;
                                    checkboxIpAddresses[1] = JSON.parse(body).droplets[1].networks.v4[0].ip_address;
                                    checkboxIpAddresses[2] = JSON.parse(body).droplets[2].networks.v4[0].ip_address;

                                    var inventory = '';

                                    var inventoryOptions = ` ansible_ssh_user=root ansible_ssh_private_key_file=${__dirname}/do-checkbox.key ansible_python_interpreter=/usr/bin/python3 ansible_ssh_common_args='-o StrictHostKeyChecking=no'`;

                                    inventory += `[checkbox]\n`;

                                    inventory += checkboxIpAddresses[0] + inventoryOptions + '\n';
                                    inventory += checkboxIpAddresses[1] + inventoryOptions + '\n';
                                    inventory += checkboxIpAddresses[2] + inventoryOptions + '\n';

                                    fs.writeFile(`${__dirname}/inventory-checkbox`, inventory, function (error) {
                                        if (error) console.log('Failed to write inventory file\n\n', error, '\n');
                                        else console.log('Successfully wrote inventory file\n');
                                    });
                                }
                            });
                        }, 30000);
                    }
                });
            }
        });
    }
});
