var needle = require("needle");
var os = require("os");

var config = {};
token = process.env.dropletToken;
sshKey = process.env.sshKey

var headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
};

var client = {
    listRegions: function(onResponse) {
        needle.get("https://api.digitalocean.com/v2/regions", { headers: headers }, onResponse)
    },

    createDroplet: function(dropletName, region, imageName, onResponse) {
        var data = {
            "name": dropletName,
            "region": region,
            "size": "512mb",
            "image": imageName,
            "ssh_keys": [sshKey],
            "backups": false,
            "ipv6": false,
            "user_data": null,
            "private_networking": null
        };

        console.log("Attempting to create: " + JSON.stringify(data));

        needle.post("https://api.digitalocean.com/v2/droplets", data, { headers: headers, json: true }, onResponse);
    },

    getDropletInfo: function(dropletID, onResponse) {
        needle.get("https://api.digitalocean.com/v2/droplets/" + dropletID, { headers: headers }, onResponse)
    }
};



var params = {
    dropletName: "samunot" + os.hostname(),
    region: "nyc1",
    imageName: "ubuntu-14-04-x64"
}

function createNewDroplet(params) {
    return new Promise((resolve, reject) => {
        client.createDroplet(params.dropletName, params.region, params.imageName, function(err, resp, body) {
            if (err) {
                reject(err)
            }
            if (resp.statusCode == 202) {
                var data = resp.body;
                if (data.droplet) {
                    resolve(data.droplet.id);
                }
            }

        })
    })
}

function describeDroplet(id) {
    return new Promise((resolve, reject) => {
        var interval = setInterval(function() {

            client.getDropletInfo(id, function(error, response) {
                if (error) {
                    reject(error)
                }
                var data = response.body;
                if (data.droplet) {
                    if (data.droplet.networks.v4.length > 0) {
                        console.log(data.droplet.name);
                        console.log(data.droplet.networks.v4[0].ip_address);
                        console.log("Droplet created successfully");
                        clearInterval(interval);
                    }
                }
            });
        }, 1500);
    })

}

createNewDroplet(params).then(describeDroplet).catch(console.log);