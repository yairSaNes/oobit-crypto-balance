# Crypto Balance & Exchange Rate Service

This project consists of two microservices: **Balance Service** and **Rate Service**, designed to manage user balances in various cryptocurrencies and retrieve real-time exchange rates.

## Getting Started

### Prerequisites
- Docker (optional for containerized deployment)
- Node.js & npm

### Running the Services

#### Using Docker
To run the services in a Docker environment:

**1. Build the balance-service image:**
```sh
docker build --target runner-balance -t balance-service .
```

**2. Build the rate-service image:**
```sh
docker build --target runner-rate -t rate-service .
```

**3. Run the balance-service container:**
```sh
docker run -p 3001:3001 -e PORT=3001 -e RATE_SERVICE_URL=http://host.docker.internal:3002 balance-service
```

**4. Run the rate-service container:**
```sh
docker run -p 3002:3002 -e PORT=3002 rate-service
```

#### Running Locally
To run the services on your local machine:

1. Install dependencies:
```sh
npm install
```

2. Build the project:
```sh
npm run build
```

3. Start the balance service:
```sh
npm run start:balance
```

4. Start the rate service:
```sh
npm run start:rate
```

### Sending Requests
You can use the `requests.http` file to test API endpoints using an HTTP client such as VS Code's REST Client extension. Alternatively, use `curl` to send requests from the command line.

---

## Services Overview

### 1. Balance Service (`/balances`)
Manages user balances, transfers, and rebalancing.

#### Endpoints:

- **`GET /balances`** - Retrieve all user balances (Admin only).
- **`GET /balances/user`** - Retrieve a specific user's balance.
- **`GET /balances/user/value`** - Get a user's balance value in a specific currency.
- **`POST /balances/user/add`** - Create a new user.
- **`PUT /balances/user/update`** - Update a user's balance.
- **`PUT /balances/user/rebalance`** - Rebalance a user's portfolio.
- **`PUT /balances/user/transfer`** - Transfer crypto between users.
- **`DELETE /balances/user/remove`** - Remove a user.

### 2. Rate Service (`/rates`)
Fetches cryptocurrency exchange rates.

#### Endpoints:

- **`GET /rates/rate?coin={coin}&currency={currency}`** - Get the exchange rate for a specific coin in a specified currency.
- **`GET /rates/supported-coins`** - Retrieve a list of supported cryptocurrencies.
- **`GET /rates/supported-currencies`** - Retrieve a list of supported fiat currencies.

---

## Shared Module
Both services use shared utilities for:
- **Authentication** (`auth.service.ts`) - Handles user authentication.
- **Logging** (`logging.service.ts`) - Provides logging utilities.
- **Custom Errors** (`AppError.ts`) - Defines standardized error handling.

This structure ensures consistency and reusability across services.

---

## License
MIT

