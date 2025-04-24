# Lighthouse Performance Testing Backend

An API-first Node.js/TypeScript application for performing automated Google Lighthouse performance tests across multiple locations and devices, storing results and screenshots in MongoDB and S3-compatible storage.

## Features

-   **Task Ingestion API:** Submit URLs for testing via a REST API endpoint.
-   **Task Queue:** Utilizes a message queue (BullMQ/Redis) to manage and process test tasks asynchronously.
-   **Lighthouse Integration:** Runs Lighthouse audits using Puppeteer.
-   **Multiple Configurations:** Supports testing with different device types, browsers (via Puppeteer emulation), and simulated locations.
-   **S3/MinIO Storage:** Saves screenshots to S3-compatible object storage.
-   **JSON Results:** Stores full Lighthouse report JSON (with screenshot data replaced by S3 object keys) in MongoDB.
-   **Signed URLs:** API provides temporary signed URLs for accessing screenshots from S3.

## Tech Stack

-   **Language:** TypeScript
-   **Runtime:** Node.js
-   **Web Framework:** Express
-   **Database:** MongoDB (via Mongoose)
-   **Message Queue:** BullMQ (requires Redis)
-   **Browser Automation:** Puppeteer
-   **Performance Audit:** Lighthouse
-   **Object Storage:** AWS SDK v3 (compatible with S3 and MinIO)
-   **Configuration:** dotenv
-   **Validation:** Zod

## Prerequisites

-   Node.js (v18+ recommended) and npm
-   MongoDB server (running)
-   Redis server (running)
-   An S3-compatible object storage instance (e.g., AWS S3, MinIO)
-   Docker and Docker Compose (if running with Docker)

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Ygohel18/lighthouse-api-test
    cd lighthouse-api-test
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the project root directory and fill in your configuration details.

    ```env
    # .env file for Backend

    # API Server Port
    PORT=3000

    # MongoDB Connection
    # Use mongodb://... for direct connection or mongodb+srv://... for SRV (cloud providers)
    # Note: In Docker Compose, this will be overridden to connect to the 'mongo' service.
    MONGO_URI=mongodb://localhost:27017/lighthouse_db

    # Redis Connection (for BullMQ)
    # Note: In Docker Compose, this will be overridden to connect to the 'redis' service.
    REDIS_HOST=localhost
    REDIS_PORT=6379

    # S3/MinIO Configuration
    # Required for AWS S3 or MinIO
    S3_ACCESS_KEY_ID=YOUR_S3_ACCESS_KEY_ID
    S3_SECRET_ACCESS_KEY=YOUR_S3_SECRET_ACCESS_KEY
    S3_BUCKET_NAME=your-lighthouse-bucket-name
    S3_REGION=us-east-1 # Or your AWS region, or 'auto' for MinIO

    # Required for MinIO or other S3-compatible endpoints (NOT needed for standard AWS S3)
    # Note: In Docker Compose, this will be overridden to connect to the 'minio' service.
    S3_ENDPOINT=http://localhost:9000 # Example for local MinIO (change port if needed)

    # Optional: Signed URL expiration in seconds (default 900 = 15 minutes)
    # S3_SIGNED_URL_EXPIRES_SECONDS=3600

    # Lighthouse Configuration
    # Timeout for page navigation in ms (default 60000)
    # LIGHTHOUSE_NAVIGATION_TIMEOUT=90000
    # How Lighthouse simulates network conditions ('simulate' or 'provided') (default 'simulate')
    # LIGHTHOUSE_THROTTLING_METHOD=simulate

    # Optional: Proxy settings if needed for geo-location (requires code implementation)
    # PROXY_SERVER=http://user:pass@proxy.example.com:8080
    ```
    **Important:** Ensure your S3 credentials, bucket name, and region are correct. If using MinIO, the `S3_ENDPOINT` is mandatory. If using AWS S3, `S3_ENDPOINT` should be omitted or undefined.

4.  **Build the TypeScript code:**
    ```bash
    npm run build
    ```
    This compiles the TypeScript files in `src/` to JavaScript in `dist/`.

## Running the Application

The application consists of an API server and one or more worker processes. You can run them directly on your host or using Docker Compose.

### Method 1: Running Directly on the Host

Requires local MongoDB, Redis, and S3/MinIO to be running and accessible.

1.  **Ensure Prerequisites:** Verify MongoDB, Redis, and your S3/MinIO instance are running and accessible from your host machine.
2.  **Start the API Server:** Open a terminal in the project root and run:
    ```bash
    npm run start:api
    ```
3.  **Start the Worker Process(es):** Open one or more **new terminal windows** in the project root and run:
    ```bash
    npm run start:worker
    ```
    Run multiple worker instances to process tasks concurrently.

### Method 2: Running with Docker Compose

Uses Docker containers for MongoDB, Redis, MinIO (optional), API, and Worker.

1.  **Ensure Prerequisites:** Verify Docker and Docker Compose are installed and running. Ensure your `.env` file has the correct S3 credentials and bucket name.
2.  **Start the Stack:** Open a terminal in the project root and run:
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Builds the Docker images (needed the first time or after code/Dockerfile changes).
    *   `-d`: Runs containers in detached mode (background). Omit for foreground logs.
    This will start all services: `mongo`, `redis`, `minio` (if configured), `createbuckets` (runs once), `api`, and `worker`.
3.  **Check Status:**
    ```bash
    docker-compose ps
    ```
4.  **View Logs:**
    ```bash
    docker-compose logs -f api      # Follow API logs
    docker-compose logs -f worker   # Follow Worker logs
    docker-compose logs -f minio    # Follow MinIO logs
    ```
5.  **Scale Workers:** To run more worker instances:
    ```bash
    docker-compose up --scale worker=3 -d # Starts 3 worker instances
    ```
6.  **Stop:**
    ```bash
    docker-compose down             # Stops and removes containers/networks
    docker-compose down -v          # Stops and removes containers/networks/volumes (deletes data)
    ```

## API Endpoints

-   `POST /tasks`: Submit a new URL for testing.
    -   Body: `{"url": "https://example.com", "configs": [...]}` (configs optional)
    -   Returns: `Task` object including `taskId`.
-   `GET /tasks/:taskId`: Get the status and results for a specific task.
    -   Returns: `Task` object with `results` array. Screenshot data in the report JSON is replaced by temporary signed S3 URLs.
-   `GET /tasks`: Get a list of recent tasks (optional route).

## Testing

You can use `curl` or a tool like Postman/Insomnia to interact with the API.

1.  **Submit a Task:**
    ```bash
    curl -X POST http://localhost:3000/tasks \
    -H "Content-Type: application/json" \
    -d '{"url": "https://web.dev"}'
    ```
    (Adjust `http://localhost:3000` based on your setup, e.g., `http://localhost:8080` if using Dockerized Nginx).

2.  **Get Task Status/Results:** Use the `taskId` from the POST response.
    ```bash
    curl http://localhost:3000/tasks/<your-task-id>
    ```
    Keep checking until the status is 'completed'. The `report` field in the results will contain the full Lighthouse JSON with signed URLs for screenshots.

3.  **Postman:** Import the provided Postman Collection JSON to easily test the endpoints.

## Troubleshooting

-   `ERR_REQUIRE_ESM`: Usually indicates a module system conflict. Ensure you have run `npm run build` after saving changes. If persistent, try cleaning caches (`npm cache clean --force`, delete `node_modules`, `package-lock.json`, `dist`) and reinstalling/rebuilding. Switching Node.js versions (e.g., to v20 LTS) might also help.
-   `AuthorizationHeaderMalformed`: S3/MinIO authentication failure. Double-check `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, and `S3_ENDPOINT` in your `.env` and Docker Compose environment variables. Ensure `forcePathStyle` is correctly configured in `s3Service.ts` based on your S3 provider. Check system time sync.
-   `PAGE_HUNG`: Lighthouse timed out waiting for the page to load. Increase `LIGHTHOUSE_NAVIGATION_TIMEOUT` in your `.env`.a