#!/bin/bash

# Check if first argument is a docker-compose command (build, up, down, etc.)
if [[ "$1" == "" ]] || [[ "$1" != "exec" && "$1" != "run" && "$1" != "build" && "$1" != "up" && "$1" != "down" && "$1" != "ps" && "$1" != "stop" && "$1" != "start" && "$1" != "logs" && "$1" != "restart" ]]; then
    # Run commands inside the nestapi container
    docker-compose -f docker-compose.yml run --rm nestapi "$@"
elif [[ "$1" == "exec" ]]; then
    # exec requires service name, so add nestapi before the rest of the args
    docker compose -f docker-compose.yml exec nestapi "${@:2}"
else
    # Run other docker-compose commands (run, up, down, build, etc.)
    docker compose -f docker-compose.yml "$@"
fi