# to run in docker env:

## Build balance-service image
docker build --target runner-balance -t balance-service .

## Build rate-service image
docker build --target runner-rate -t rate-service .

## Run balance-service container
docker run -p 3001:3001 -e PORT=3001 -e RATE_SERVICE_URL=http://host.docker.internal:3002 balance-service

## Run rate-service container
docker run -p 3002:3002 -e PORT=3002 rate-service

------------------------------------------------------------------------------------------------------------------

# to run localy run: 

npm install

npm run:build

terminal1: npm run start:balance

terminal2: npm run start:rate
