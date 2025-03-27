# Crypto Balance System

## Introduction

The Crypto Balance System is a simple microservices-based application for managing cryptocurrency balances and fetching exchange rates. It consists of two services:

Balance Service (Port 3001): Handles user balances, transactions, and portfolio rebalancing.

Rate Service (Port 3002): Provides real-time exchange rates for supported cryptocurrencies and fiat currencies.

The system is built using NestJS and follows a monorepo structure. It relies on CoinGecko’s API for exchange rate data and stores balance information in local JSON files.


------------------------------------------------------------------------------------------------------------------

## Getting Started

### Running in Docker Environment

#### Build Images
```sh
# Build balance-service image
docker build --target runner-balance -t balance-service .

# Build rate-service image
docker build --target runner-rate -t rate-service .
```

#### Run Containers
```sh
# Run balance-service container
docker run -p 3001:3001 -e PORT=3001 -e RATE_SERVICE_URL=http://host.docker.internal:3002 balance-service

# Run rate-service container
docker run -p 3002:3002 -e PORT=3002 rate-service
```

### Running Locally

```sh
npm install
npm run build
```

#### Start Services
```sh
# In terminal 1
npm run start:balance

# In terminal 2
npm run start:rate
```

### Testing Requests
Requests can be sent using the `requests.http` file included in the project, or via a tool like postman.

------------------------------------------------------------------------------------------------------------------

## Service Overview

### **Balance Service** (Port 3001)
Manages user crypto balances, transfers, and rebalancing.

#### **Endpoints:**

##### **1. Get all user balances**
**GET** `/balances`
- **Headers:**
  - `X-User-Password` (string, required) → Admin password for authentication.
- **Response:** Returns all users' balances.

- ##### **2. Create a new user**
**POST** `/balances/user/add`
- **Headers:**
  - `X-User-ID` (string, required) → User's ID.
  - `X-User-Password` (string, required) → Password for the user.
- **Response:** Confirms user creation.

##### **3. Get a specific user balance**
**GET** `/balances/user`
- **Headers:**
  - `X-User-ID` (string, required) → User's ID.
  - `X-User-Password` (string, required) → User's password.
- **Response:** Returns the balance of the requested user.

##### **4. Get user balance value in a specific currency**
**GET** `/balances/user/value`
- **Headers:**
  - `X-User-ID` (string, required) → User's ID.
  - `X-User-Password` (string, required) → User's password.
- **Query Parameters:**
  - `currency` (string, optional, default: `usd`) → Target currency for conversion.
- **Response:** Returns the user's balance value in the specified currency.

##### **5. Update user balance**
**PUT** `/balances/user/update`
- **Headers:**
  - `X-User-ID` (string, required) → User's ID.
  - `X-User-Password` (string, required) → User's password.
- **Body:**
  ```json
  {
    "coin": "string", // Required, cryptocurrency name (e.g., "bitcoin")
    "amount": "number" // Required, amount to add or subtract
  }
  ```
- **Response:** Returns updated balance.

##### **6. Transfer cryptocurrency to another user**
**PUT** `/balances/user/transfer`
- **Headers:**
  - `X-User-ID` (string, required) → User's ID.
  - `X-User-Password` (string, required) → User's password.
- **Body:**
  ```json
  {
    "targetUserId": "string", // Required, recipient's user ID
    "coin": "string", // Required, cryptocurrency symbol
    "amount": "number" // Required, amount to transfer
  }
  ```
- **Response:** Returns updated balance of the sender.

##### **7. Rebalance user portfolio**
**PUT** `/balances/user/rebalance`
- **Headers:**
  - `X-User-ID` (string, required) → User's ID.
  - `X-User-Password` (string, required) → User's password.
- **Body:**
  ```json
  {
    "BTbitcoinC": 50, // Percentage allocation
    "ethereum": 50  
  }
  ```
- **Response:** Returns rebalanced portfolio.

##### **8. Remove a user**
**DELETE** `/balances/user/remove`
- **Headers:**
  - `X-User-ID` (string, required) → User's ID.
  - `X-User-Password` (string, required) → User's password.
- **Response:** Confirms user removal.

 ### approach explaiation:
 this module supports all basic CRUD operations for users. 
 
 for user actions a password is requred which is 
 
 authenticated with the shared module's auth service.
 
 all crypto currency rates are fetched from rate-servcie by API calls.
 
 bonus features:
 - rebalance method
 - tranfer between users
 - authentication
 - periodically update system data to rate-service for rates caching mechanizm

------------------------------------------------------------------------------------------------------------------

### **Rate Service** (Port 3002)
Provides cryptocurrency exchange rates.

#### **Endpoints:**

##### **1. Get exchange rate for a cryptocurrency**
**GET** `/rates/rate`
- **Query Parameters:**
  - `coin` (string, required) → Cryptocurrency name.
  - `currency` (string, required) → Target currency.
- **Response:** Returns the exchange rate.

##### **2. Get multiple coin rates**
**GET** `/rates`
- **Query Parameters:**
  - `coins` (string, required) → Comma-separated list of cryptocurrencies.
  - `currency` (string, required) → Target currency.
- **Response:** Returns exchange rates for multiple coins.

##### **3. Get supported coins**
**GET** `/rates/coins`
- **Response:** Returns a list of supported coins.

##### **4. Get supported currencies**
**GET** `/rates/currencies`
- **Response:** Returns a list of supported currencies.

##### **5. Set tracked coins**
**POST** `/rates/coins`
- **Body:**
  ```json
  {
    "coins": ["bitcoin", "ethereum", "solana"]
  }
  ```
- **Response:** Updates the list of tracked coins.

 ### approach explaiation:
 this module supports the communication to the coin gecho api. 

 a caching mechanizm is implemented to minimize API calls:

 cached data is only for coins and currencies that are contained in trackedCoins and trackedCurrencies

 cache ttl is 1 minute (because rates change prequently)

 rates are fetched to cache every 1 minute

 cached data is stored in ram for fast readings

 trackedCoins and trackedCurrencies are periodically backed-up to file every 5 minutes
 

------------------------------------------------------------------------------------------------------------------
## Continuous Integration (CI)

The project includes a GitHub Actions workflow for continuous integration. It runs on every pull request to the main branch and performs the following steps:

Checks out the repository.

Sets up Node.js (version 20.x).

Installs dependencies using npm ci.

Runs linting with npm run lint.

Builds both services (balance-service and rate-service).

This ensures code quality and that builds are successful before merging changes.

------------------------------------------------------------------------------------------------------------------


## Shared Module
The shared module provides utilities used by both services, including:
- **Authentication Service:** Handles user authentication and password management.
- **Logging Service:** Provides logging capabilities.
- **AppError Class + Error Handling Module:** Standardized error handling.
- **File Service:** Provides unified File system capabilities.
- **Interfaces:** interfaces for different system entities.

This modular approach improves maintainability and code reuse across services.


------------------------------------------------------------------------------------------------------------------

## what i wpuld have done differently:

- add unit tests for 


