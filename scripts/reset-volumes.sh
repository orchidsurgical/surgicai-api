#!/bin/bash

set -e

# delete volumes
docker-compose down
docker volume rm $(docker volume ls -q --filter "name=surgicai")
