var AWS = require('aws-sdk');
var os = require("os");

var aws_access_key = process.env.AWSAccessKeyId;
var aws_secret_key = process.env.AWSSecretKey;

var region = 'us-east-1';
AWS.config.update({ region: region, accessKeyId: aws_access_key, secretAccessKey: aws_secret_key });
var ec2 = new AWS.EC2();

var params = {
    ImageId: 'ami-97785bed',
    InstanceType: 't2.micro',
    MinCount: 1,
    MaxCount: 1
};
var instanceId;

function createInstance(params) {
    return new Promise((resolve, reject) => {
        ec2.runInstances(params, function(err, data) {
            if (err) {
                reject("Could not create instance")
            }
            instanceId = data.Instances[0].InstanceId;
            console.log("Created instance", instanceId);
            resolve(instanceId)
        });
    })
}

function describeInstanceData(instanceId) {
    return new Promise((resolve, reject) => {
        var interval = setInterval(function() {
            var instanceIdParam = { InstanceIds: [instanceId] };
            ec2.describeInstances(instanceIdParam, function(err, data) {
                if (err) {
                    reject(err.stack);
                } else {
                    if (data.Reservations && data.Reservations[0].Instances && data.Reservations[0].Instances.length > 0 && data.Reservations[0].Instances[0].State.Name == "running") {
                        var createdInstance = data.Reservations[0].Instances[0];
                        console.log("Instance Id: " + createdInstance.InstanceId);
                        console.log("Public IpAddress: " + createdInstance.PublicIpAddress);
                        console.log("Instance Type: " + createdInstance.InstanceType);
                        console.log("State: " + createdInstance.State.Name);
                        console.log("EC2 instance created successfully");
                        clearInterval(interval);
                    }
                }
            });
        }, 2000);
    })
}

createInstance(params).then(describeInstanceData).catch(console.log)