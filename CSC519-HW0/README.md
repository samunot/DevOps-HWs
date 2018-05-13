# HW0

1. Computing Envrionment

Vagrantfile is added using which VM was setup.

Commands:

`vagrant init ubuntu/trusty64`

`vagrant up`

`vagrant ssh`

2. Pipeline

post-commit and post-receive files are added using which simple hooks and pipeline is demonstrated in the screencast.

post-commit script:

`#!/bin/bash`

`start http://www.google.com`

post-receive script:

`#!/bin/bash`

`GIT_WORK_TREE=../../deploy/production-www/ git checkout -f`

`echo "Pushed to production"`

Commands:

`git init --bare` creates a bare repo

`git remote add prod ../deploy/production.git` and `git push prod master` adds a remote repo locally

3. Screencast: [Link](https://youtu.be/65-XdpEB3yM)


