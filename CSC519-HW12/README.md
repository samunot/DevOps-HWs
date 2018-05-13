# Provisioning Servers

## Steps

1) Download the playbook(ansible script) and inventory file. If you are using linux or MacOS, you can run the ansible script on localhost. If you are using Windows, vagrant is suggested. I have ran this using a vagrant machine.

2) You will have to export few variables:
ncsu gitusername, gitpassword, DigitalOcean token and ssh key, AWS access key and secret key.

3) Run the command below:
`ansible-playbook playbook.yml -i inventory -vvv`

## Screencast

[Youtube Link](https://youtu.be/-dyHYQWtG5Y)

## Concepts

### I) Define idempotency. Give two examples of an idempotent operation and non-idempotent operation.

It is a property of operations that they can be applied multiple times without changing the result of initial application.
It essentially means if an operation is applied single time or hundred times, the result would be the same. It shouldn't end in error.
Final state should always be the same.

#### Idempotent Example:

1. GET call in REST API. No matter how many times you call a GET, it will always give the same result.
2. Absolute function in any programming language. Eg: abs(-10) = 10, abs(abs(abs(-10))) will also be 10

#### Non Idempotent Example:

1. POST call in REST API. It is non idempotent because once you call a POST it will throw an error the next time.
2. Git clone is non idempotent. It will throw an error if you try ro clone the same repo. to circumvent the issue one can force clone the repo.

### II) Describe several issues related to management of your inventory.

1. API tokens get refreshed and managing them is a havoc. So one has to keep a track and update their inventory accordingly. This can be really taxing
2. Sometimes there can be mix up of IP addresses while using multiple instances. This can be cumbersome because if intended machine is not connceted it can create more problems.
3. Passwords are sometimes mentioned in the file which is not a good practise and can lead to security breach.
4. SSH keys are important to connect to servers and if they are open to public, it can lead to fatality.

### III) Describe two configuration models. What are disadvantages and advantages of each model?

#### 1. Push Model:
 A central server communicates with the nodes and sends them updates as they are needed.
 When a change is made in the code, each node is alerted of this and they run the changes.
 
 ##### Advantages:
1. PUSH model is easier to manage.
2. There is Less enforcement of state so asset is able to drift from config.
3. Asset is centrally managed.
4. Errors are synchronous

##### Disadvantages:
1. Scalability is difficult using push model
2. Lack of complete automation 

#### 2. Pull Model:
A server acts like a master while the clients usually contact the master to find out what they need to do and thus pulling 
their configuration information from the master.

##### Advantages:
1. Better at ensuring assets stay in sync with config
2. Asset can register itself
3. More Scalibility than push model
4. Can fully automate the configuration of newly booted server

##### Disadvantages:
1. Very Complex
2. All have to stick with the same configuration management lanaguage which is not ideal.

### IV) What are some of the consquences of not having proper configuration management?

1. Bad configuration management can lead to security breaches, if keys and passwords are not handled properly. So they are of utmost importance.
2. Data should be managed in a correct fashion or else private data can be exposed to the public
3. Installing wrong component can lead to hazardous situations, so this should be avoided by doing proper configuration management.
4. Continuous changes in the environment is a huge concern and should be handled with care. Proper configuration is utmost important or else it might result in system down.
5. Replacing a component without proper steps can result in system failure, hence proper configuration management is needed.
