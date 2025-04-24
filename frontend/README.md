
# Lighthouse Performance Dashboard Frontend

A Next.js application using Shadcn UI to provide a user interface for the Lighthouse Performance Testing Backend. It allows submitting new tests, viewing recent tasks, and inspecting detailed performance reports and screenshots.

## Features

-   **Task Submission:** Form to submit URLs for testing via the backend API.
-   **Recent Tasks List:** Displays a list of recent test tasks with status and basic info.
-   **Task Detail View:** Shows comprehensive results for a single task, including metrics, score, screenshots, and the full report JSON.
-   **Screenshot Gallery:** Displays screenshots fetched via temporary signed URLs from S3/MinIO.
-   **Raw Report Viewer:** Collapsible section to view the complete Lighthouse report JSON with syntax highlighting.

## Tech Stack

-   **Framework:** Next.js (App Router)
-   **UI Library:** Shadcn UI (built on Tailwind CSS and Radix UI)
-   **Language:** TypeScript
-   **Data Fetching/State Management:** React Query (TanStack Query)
-   **Styling:** Tailwind CSS
-   **Form Handling:** React Hook Form, Zod, Zod Resolver
-   **Date Formatting:** date-fns
-   **JSON Highlighting:** react-syntax-highlighter

## Prerequisites

-   Node.js (v18+ recommended) and npm
-   The Lighthouse Performance Testing Backend must be running and accessible.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Ygohel18/lighthouse-frontend-test
    cd lighthouse-frontend-test
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Initialize Shadcn UI:**
    ```bash
    npx shadcn@latest init
    ```
    Follow the prompts to configure `components.json` and Tailwind CSS.

4.  **Add Shadcn UI Components:**
    Add the components used in the project:
    ```bash
    npx shadcn@latest add button input label form table card badge accordion collapsible progress select dialog alert
    ```

5.  **Install Additional Libraries:**
    ```bash
    npm install @tanstack/react-query @tanstack/react-query-devtools date-fns react-syntax-highlighter @hookform/resolvers zod lucide-react
    npm install --save-dev @types/react-syntax-highlighter
    ```

6.  **Configure Backend API URL:**
    Create a `.env.local` file in the frontend project root directory.

    ```env
    # .env.local file for Frontend

    # This is the URL where your backend API is accessible FROM YOUR BROWSER.
    # Adjust based on how you are running the backend (host or docker) and your local Nginx setup.

    # If backend is running directly on host:
    # NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

    # If backend is running in Docker (accessing Docker Nginx directly):
    # NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

    # If backend is running in Docker (accessing via your local Nginx path proxy, e.g., /lighthouse):
    # NEXT_PUBLIC_API_BASE_URL=http://localhost/lighthouse

    # If backend is running in Docker (accessing via your local Nginx subdomain proxy, e.g., lighthouse.localhost):
    # NEXT_PUBLIC_API_BASE_URL=http://lighthouse.localhost

    # Choose ONE of the above based on your backend setup:
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
    ```

## Running the Application

1.  **Ensure Backend is Running:** Make sure your backend API is fully operational and accessible at the `NEXT_PUBLIC_API_BASE_URL` configured in `.env.local`.
2.  **Start the Development Server:** Open a terminal in the frontend project root and run:
    ```bash
    npm run dev
    ```
    This starts the Next.js development server, usually on `http://localhost:3000`.
3.  **Open in Browser:** Navigate to the address shown in the terminal (default `http://localhost:3000`).

### Production Build

To build and run the application for production:

1.  **Build:**
    ```bash
    npm run build
    ```
    This creates the production build in the `.next` directory.
2.  **Start:**
    ```bash
    npm start
    ```
    This starts the Next.js production server.

## Connecting to the Backend

The frontend communicates with the backend API using the URL specified in the `NEXT_PUBLIC_API_BASE_URL` environment variable. Ensure this variable is correctly set in your `.env.local` file to match the access point of your running backend instance (whether direct host or via Nginx/Docker).

## Troubleshooting

-   `Error: Failed to fetch`: The frontend could not reach the backend API. Verify the backend is running and `NEXT_PUBLIC_API_BASE_URL` is correct. Check for firewall or CORS issues (backend needs CORS middleware).
-   `[Component] is not defined`: A Shadcn UI component is used but not correctly imported or added. Ensure the component is imported (`import { Component } from '@/components/ui/component';`) and that you ran `npx shadcn@latest add component`. Clearing Next.js cache (`rm -rf .next`) and reinstalling dependencies might help (`rm -rf node_modules package-lock.json && npm install`).
-   `Cannot find module '...'`: A required npm package is not installed. Run `npm install <package-name>` (or `--save-dev` for dev dependencies like `@types`).