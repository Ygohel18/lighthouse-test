# Lighthouse Performance Testing Stack

This repository contains the backend API and frontend dashboard for an automated web performance testing platform powered by Google Lighthouse, MongoDB, Redis, and S3-compatible storage.

The project is structured into two main subdirectories:

- `backend/`: The Node.js/TypeScript API and worker services.
- `frontend/`: The Next.js/Shadcn UI dashboard.

## Prerequisites

- Node.js (v18+ recommended) and npm
- Docker and Docker Compose (for Docker setup)

## Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ygohel18/lighthouse-test
    cd lighthouse-test
    ```

2.  **Backend Setup:**
    Refer to the `backend/README.md` for detailed backend setup instructions, including installing dependencies, configuring the `.env` file (for MongoDB, Redis, S3 credentials, etc.), and building the TypeScript code.

    ```bash
    cd backend
    npm install
    # Configure .env file
    npm run build
    cd .. # Return to root
    ```

3.  **Frontend Setup:**
    Refer to the `frontend/README.md` for detailed frontend setup instructions, including installing dependencies, initializing Shadcn UI, adding components, and configuring the `.env.local` file (for the backend API URL when running frontend on host).
    ```bash
    cd frontend
    npm install
    npx shadcn@latest init # Follow prompts
    npx shadcn@latest add button input label form table card badge accordion collapsible progress select dialog # Add necessary components
    npm install @tanstack/react-query @tanstack/react-query-devtools date-fns recharts @tanstack/react-table @hookform/resolvers zod lucide-react # Install additional libs
    # Configure .env.local file
    cd .. # Return to root
    ```

## Running the Application

You can run the entire stack using Docker Compose or run backend and frontend processes separately on your host machine.

### Method 1: Running with Docker Compose (Recommended)

This method uses Docker containers for all services (MongoDB, Redis, MinIO, Backend API, Backend Worker, Backend Nginx, Frontend App, Frontend Nginx).

1.  **Ensure Docker is Running:** Make sure the Docker daemon is active.
2.  **Configure Backend .env:** Ensure `backend/.env` is correctly configured with your S3/MinIO credentials. The DB/Redis/S3 endpoints will be overridden in `docker-compose.yml` to use service names.
3.  **Start the Stack:** Open a terminal in the project root (`project-root/`) and run:
    ```bash
    docker-compose up --build -d
    ```
    - `--build`: Builds images (needed initially or after code/Dockerfile changes).
    - `-d`: Runs containers in detached mode.
4.  **Access:**
    - Frontend Dashboard: `http://localhost:3000`
    - Backend API (Direct): `http://localhost:8080`
5.  **Stop:**
    `bash
    docker-compose down             # Stops and removes containers/networks
    docker-compose down -v          # Stops and removes containers/networks/volumes (deletes data)
    `
    Refer to `backend/README.md` and `frontend/README.md` for viewing logs, scaling workers, etc.

### Method 2: Running Directly on the Host

Requires local MongoDB, Redis, S3/MinIO, Node.js, and npm to be installed and running.

1.  **Ensure Prerequisites:** Verify all dependencies (MongoDB, Redis, S3/MinIO access, Node.js, npm) are set up and running on your host.
2.  **Configure Backend .env:** Ensure `backend/.env` is correctly configured to point to your local MongoDB, Redis, and S3/MinIO instances.
3.  **Configure Frontend .env.local:** Ensure `frontend/.env.local` is correctly configured with the `NEXT_PUBLIC_API_BASE_URL` pointing to where your backend API is accessible on the host (e.g., `http://localhost:3000`).
4.  **Start Backend:** Open terminals in the `backend/` directory and run:
    ```bash
    npm run start:api    # Terminal 1
    npm run start:worker # Terminal 2 (run multiple times for more workers)
    ```
5.  **Start Frontend:** Open a terminal in the `frontend/` directory and run:
    ```bash
    npm run dev
    ```
6.  **Access:** Open your browser and go to the address shown by the frontend dev server (usually `http://localhost:3000`).
    Refer to individual READMEs for more details on host setup and running.