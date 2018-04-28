
//////////////////////////////////////////
//                                      //
//    Digital Ocean Provisioner [x1]    //
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
var dropletId;
var dropletIpAddress;

var listKeysOptions =
{
    url : url + 'account/keys',
    method : 'GET',
    headers : headers
};

request(listKeysOptions, function(error, response, body)
{
    if (error) console.log('\nFailed to list keys\n\n', error, '\n');
    else
    {
        console.log('\nSuccessfully listed keys\n');

        keys = JSON.parse(body).ssh_keys;

        for (i = 0; i < keys.length; i++)
        {
            if (keys[i].name === 'Checkbox Key') checkboxKeyId =  keys[i].id;
        }

        var createDropletOptions =
        {
            url : url + 'droplets',
            method : 'POST',
            headers : headers,
            json :
            {
                'name' : `Checkbox-${new Date().getTime()}`,
                'region' : 'nyc1',
                'size' : 's-2vcpu-4gb',
                'image' : 'ubuntu-16-04-x64',
                'ssh_keys' : [ checkboxKeyId ],
                'tags' : [ 'checkbox' ]
            }
        };

        request(createDropletOptions, function(error, response, body)
        {
            if (error) console.log('Failed to create droplet\n\n', error, '\n');
            else
            {
                console.log('Successfully created droplet\n');

                dropletId = body.droplet.id;

                console.log('Pausing for 30 seconds...\n');

                setTimeout(function()
                {
                    var listDropletOptions =
                    {
                        url : url + `/droplets/${dropletId}`,
                        method : 'GET',
                        headers : headers
                    };

                    request(listDropletOptions, function(error, response, body)
                    {
                        if (error) console.log('Failed to list droplet\n\n', error, '\n');
                        else
                        {
                            console.log('Successfully listed droplet\n');

                            dropletIpAddress = JSON.parse(body).droplet.networks.v4[0].ip_address;

                            fs.open(`${__dirname}/inventory-checkbox`, 'a', function(error)
                            {
                                if (error) console.log('Failed to open file\n\n', error, '\n');
                                else
                                {
                                    console.log('Successfully opened file\n');

                                    var inventoryItem = dropletIpAddress;
                                    inventoryItem += ' ansible_ssh_user=root';
                                    inventoryItem += ` ansible_ssh_private_key_file=${__dirname}/do-checkbox.key`;
                                    inventoryItem += ' ansible_python_interpreter=/usr/bin/python3';
                                    inventoryItem += ` ansible_ssh_common_args='-o StrictHostKeyChecking=no'`;

                                    fs.appendFile(`${__dirname}/inventory-checkbox`, inventoryItem, function(error)
                                    {
                                        if (error) console.log('Failed to append file\n\n', error, '\n');
                                        else
                                        {
                                            console.log('Successfully appended file\n');

                                            console.log('Running configuration playbook...\n');

                                            var path = __dirname.replace(/provisioners/g, '');

                                            shell.exec(`sudo ansible-plabook ${path}playbooks/checkbox.yml -i ${path}provisioners/inventory-checkbox --limit ${dropletIpAddress}`);
                                        }
                                    });
                                }

                            });
                        }
                    });

                }, 30000);
            }
        });
    }
});
