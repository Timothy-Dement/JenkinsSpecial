
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

                            console.log(dropletIpAddress);

                        }
                    });

                }, 30000);
            }
        });
    }
});
