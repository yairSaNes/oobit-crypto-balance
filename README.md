# Crypto Balance System

This project consists of two microservices: `balance-service` and `rate-service`. It is built using NestJS with a monorepo architecture. The system provides cryptocurrency balance management and real-time exchange rate retrieval, with an optional Dockerized deployment.

## **Getting Started**
### **Running in a Docker Environment**
To run the services in Docker, follow these steps:

#### **1. Build the Docker Images**
Run the following commands to build the images for both services:
```sh
# Build balance-service image
docker build --target runner-balance -t balance-service .

# Build rate-service image
docker build --target runner-rate -t rate-service .
```

#### **2. Run the Containers**
Start the services with:
```sh
# Run balance-service container
docker run -p 3001:3001 -e PORT=3001 -e RATE_SERVICE_URL=http://host.docker.internal:3002 balance-service

# Run rate-service container
docker run -p 3002:3002 -e PORT=3002 rate-service
```

This will start:
- `balance-service` on port `3001`
- `rate-service` on port `3002`

### **Running Locally**
To run the services without Docker:

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Build the project:**
   ```sh
   npm run build
   ```
3. **Run the services in separate terminals:**
   ```sh
   # Terminal 1: Start balance-service
   npm run start:balance
   
   # Terminal 2: Start rate-service
   npm run start:rate
   ```

---
## **Services Overview**

### **1. Balance Service (`balance-service`)**
This service is responsible for managing user balances, creating accounts, and rebalancing portfolios.

#### **Endpoints**

#### **User Management**
- **`POST /user/add`** - Create a new user
  - **Headers:**
    - `x-user-id` (string, required)
    - `x-user-password` (string, required)
  - **Response:** `{ message: "User <userId> created successfully" }`

#### **Balance Management**
- **`POST /balance/deposit`** - Deposit funds into the user's balance
  - **Headers:**
    - `x-user-id` (string, required)
    - `x-user-password` (string, required)
  - **Body:** `{ coin: string, amount: number }`
  - **Response:** Updated balance details

- **`GET /balance`** - Retrieve user balances
  - **Headers:**
    - `x-user-id` (string, required)
    - `x-user-password` (string, required)
  - **Response:** List of balances

#### **Rebalancing**
- **`POST /balance/rebalance`** - Rebalance user portfolio
  - **Headers:**
    - `x-user-id` (string, required)
    - `x-user-password` (string, required)
  - **Body:** `{ <coin>: <percentage>, ... }`
  - **Response:** Adjusted balance based on target percentages

### **2. Rate Service (`rate-service`)**
This service provides real-time exchange rates for cryptocurrencies.

#### **Endpoints**
- **`GET /rates/rate`** - Fetch the exchange rate for a specific coin and currency
  - **Query Parameters:**
    - `coin` (string, required) - Cryptocurrency name
    - `currency` (string, optional, default: `usd`)
    - `skipCache` (boolean, optional, default: `false`)
  - **Response:** `{ coin: string, currency: string, rate: number }`

---
## **Shared Module**
The shared module contains common utilities and components used by both services, including:

- **DTOs (Data Transfer Objects)** - Defines the structure for incoming and outgoing data.
- **Custom Error Handling (`AppError`)** - A centralized error handler to provide better error messages.
- **Logging Service** - Ensures consistent logging across services.
- **Validation Middleware** - Ensures incoming requests have valid data.

---
## **Next Steps**
- Implement authentication with JWT.
- Optimize caching for exchange rates.
- Expand support for additional coins and currencies.

