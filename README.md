# MOVIEFLIX

A full-stack web application for managing and streaming movies with a Netflix-style interface. The application allows users to browse, search, view details, and play movies with a custom video player supporting YouTube videos and local media.

## Features

- Netflix-style user interface with hover effects and responsive design
- Custom video player with advanced controls
- Movie streaming with buffering indicators
- YouTube video integration
- Subtitle support (.srt files)
- Movie management (CRUD operations)
- Genre management (CRUD operations)

## Prerequisites

- Node.js (v23+) and npm - [Download Node.js](https://nodejs.org/en)
- Python (v3.13+) - [Download Python](https://www.python.org/downloads/)
- Docker (for Redis) [Download Docker](https://www.docker.com/products/docker-desktop)
- Git - [Download Git](https://git-scm.com/downloads)
- Angular CLI

## Project Structure

The project is organized into two main directories:

```
movie-platform-management/
│
├── backend/               # Django backend application
│   ├── backend/           # Backend Settings
│   ├── movies/            # Movie models and business logic
│   ├── media/             # Uploaded media files (videos, images)
│   └── manage.py          # Django management script
│
└── frontend/              # Angular frontend application
    ├── src/               # Source code
    │   ├── app/           # Angular components
    │   │   ├── components/# UI components
    │   │   ├── services/  # API services
    │   │   └── models/    # Data models
    │   │   └── shared/    # Shared components
    │   └── environments/  # Environment configurations
    └── package.json       # NPM dependencies
```

### Navigating Between Directories

When working on the project, you'll need to switch between backend and frontend directories. Here are some tips:

1. From the project root, navigate to backend:

```bash
cd backend
```

2. From the project root, navigate to frontend:

```bash
cd frontend
```

3. From backend to frontend:

```bash
cd ../frontend
```

4. From frontend to backend:

```bash
cd ../backend
```

5. Return to project root from either directory:

```bash
cd ..
```

Always make sure you're in the correct directory when running commands specific to either the backend or frontend.

## Installation

### Installing Git

1. Download Git from the official website:
   [https://git-scm.com/downloads](https://git-scm.com/downloads)

2. Follow the installation instructions for your operating system:

   - **Windows**: Run the installer and follow the prompts
   - **macOS**: Use the macOS installer or install via Homebrew: `brew install git`
   - **Linux**: Use your distribution's package manager (e.g., `apt install git` for Ubuntu)

3. Verify Git installation:

```bash
git --version
```

### Installing Python

1. Download Python from the official website:
   [https://www.python.org/downloads/](https://www.python.org/downloads/)

2. Follow the installation instructions for your operating system:

   - **Windows**: Run the installer, check "Add Python to PATH", and click "Install Now"
   - **macOS**: Run the installer package and follow the prompts
   - **Linux**: Most distributions come with Python pre-installed, otherwise use your package manager

3. Verify Python installation:

```bash
python --version
```

### Installing Node.js and npm

1. Download Node.js from the official website:
   [https://nodejs.org/en](https://nodejs.org/en)

2. Follow the installation instructions for your operating system:

   - **Windows/macOS**: Run the installer and follow the prompts
   - **Linux**: Use your distribution's package manager or NVM (Node Version Manager)

3. Verify Node.js and npm installation:

```bash
node --version
npm --version
```

### Installing Docker

1. Download and install Docker from the official website:
   [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

2. Follow the installation instructions for your operating system.

3. Verify Docker installation:

```bash
docker --version
```

### Installing Angular CLI

Install Angular CLI globally using npm:

```bash
npm install -g @angular/cli
```

Verify the installation:

```bash
ng version
```

### Backend Setup

1. Clone the repository:

```bash
git clone https://github.com/ruxeyy04/movie-platform-management.git
cd movie-platform-management
```

2. Set up a Python virtual environment:

```bash
python -m venv .venv
```

3. Activate the virtual environment:

```bash
# On Windows
.venv\Scripts\activate

# On macOS/Linux
source .venv/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Start Redis using Docker:

```bash
docker run --name django-redis -d -p 6379:6379 --rm redis
```

6. Navigate to the backend directory:

```bash
cd backend
```

7. Apply migrations:

```bash
py manage.py migrate
```

8. Create a superuser for accessing the admin interface:

```bash
py manage.py createsuperuser
```

Follow the prompts to set a username, email, and password for the superuser account. This account will have full administrative privileges.

Alternatively, you can use the default admin account:

- **Username**: admin
- **Password**: admin

> **Important**: If you customize the admin account credentials, you must also update these values in the frontend environment configuration file at `frontend/src/environments/environment.ts` to ensure proper authentication.

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

## Running the Application

### Backend

1. Make sure Redis is running:

```bash
docker ps
```

2. If Redis is not running, start it:

```bash
docker run --name django-redis -d -p 6379:6379 --rm redis
```

3. Start the Django development server:

```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000/api/`.

### Frontend

1. Navigate to the frontend directory if you're not already there:

```bash
cd frontend
```

2. Start the Angular development server:

```bash
ng serve
```

The application will be available at `http://localhost:4200/`.

## Usage

- Browse movies on the home page
- Click on a movie to view details and play it
- Use the custom video player controls to manage playback
- Upload subtitles for local videos (SRT format)
- Movie Platofmr Management can create, update, or delete movies

## Troubleshooting

- If Redis connection fails, ensure the Docker container is running.
- Check browser console for any frontend errors.
- If you encounter issues with Angular CLI, try updating it using `npm update -g @angular/cli`
