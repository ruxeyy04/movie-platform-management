# MOVIEFLIX

A full-stack web application for managing and streaming movies with a Netflix-style interface. The application allows users to browse, search, view details, and play movies with a custom video player supporting YouTube videos and local media.

![Homepage](screenshots/homepage.png)

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

### Redis (Required First)

> **IMPORTANT**: Redis must be running before starting the backend server. The Django application depends on Redis for caching, session management, and background tasks.

1. Verify if Redis is already running:

```bash
docker ps
```

2. If Redis is not running, start it:

```bash
docker run --name django-redis -d -p 6379:6379 --rm redis
```

3. Confirm Redis is running and accessible:

```bash
docker exec -it django-redis redis-cli ping
```

This should return `PONG` if Redis is running properly.

### Backend

1. Make sure Redis is running (see above).

2. Navigate to the backend directory:

```bash
cd backend
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

## Mock Data

The application includes mock data for movies and genres to help with development and testing:

### Using Mock Data

1. Mock data configuration is located in `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  // ... other settings

  // Mock data settings
  USE_MOCK_MOVIES: false, // Set to true to use mock data instead of API
  USE_MOCK_GENRES: false, // Set to true to use mock data instead of API
};
```

2. By default, mock data is disabled (set to `false`), and the application will use the real backend API.

3. To use mock data for development or testing:

   - Set `USE_MOCK_MOVIES` to `true` to use sample movie data
   - Set `USE_MOCK_GENRES` to `true` to use sample genre data
   - This allows you to explore the application with predefined data without requiring a functioning backend

4. Mock data files are located at:

   - Movies: `frontend/src/app/services/mock-movies.ts`
   - Genres: `frontend/src/app/services/mock-genres.ts`

5. You can modify these files to add or customize sample data during development.

### Benefits of Mock Data

- Develop frontend without requiring a running backend
- Test different scenarios with predictable data
- Faster development iterations with instant responses
- Work offline without backend connectivity

## Troubleshooting

- Redis issues:
  - Error "Connection refused" when starting backend: Redis is not running
  - Error "MISCONF Redis is configured to save RDB snapshots": Run `docker exec -it django-redis redis-cli config set stop-writes-on-bgsave-error no`
  - If Redis data is inconsistent, you can reset it with `docker restart django-redis`
  - For persistent Redis data, use a volume mount instead of the --rm flag
- If Redis connection fails, ensure the Docker container is running.
- Check browser console for any frontend errors.
- If you encounter issues with Angular CLI, try updating it using `npm update -g @angular/cli`
- YouTube playback issues:
  - Ensure you're using a valid YouTube URL (youtube.com or youtu.be)
  - If you encounter CORS errors, check that the YouTube video allows embedding
  - Try using the privacy-enhanced YouTube URL format (youtube-nocookie.com)
- Database migration issues:
  - Run `python manage.py makemigrations` before running `migrate` if tables are missing
  - If migration conflicts occur, try `python manage.py migrate --fake-initial`
- Authentication problems:
  - Verify admin credentials match between Django admin and environment.ts
  - Check browser cookies and local storage for stale tokens
  - Try clearing your browser cache and cookies
- Media file upload issues:
  - Ensure the media directory exists and has proper permissions
  - Check file size limits in both frontend and backend code
  - Verify supported file formats (.mp4, .webm for videos, .jpg/.png for images)
- Performance problems:
  - Use mock data during development to reduce server load
  - Consider reducing video quality settings for better streaming performance
  - Check network conditions and server resources

## Version Compatibility

While the application specifies certain versions in the prerequisites, it may work with other versions as well. Here's detailed information about version compatibility:

### Python

- **Required**: v3.13+ (specified in prerequisites)
- **Recommended**: v3.13.0 or v3.13.1
- **Also tested with**: v3.10+, v3.11+, v3.12+
- **Known issues**:
  - Python 3.9 and below may not support some of the modern syntax used
  - Python 3.14+ (prerelease) hasn't been tested extensively

### Node.js

- **Required**: v23+ (specified in prerequisites)
- **Recommended**: v23.0.0 or higher
- **Also tested with**: v20+ (LTS)
- **Known issues**:
  - Node.js below v18 may have compatibility issues with some packages
  - Using the latest LTS version is recommended for production environments

### Angular

- **Required**: Angular v19
- **Installation**: `npm install -g @angular/cli`

### Docker

- **Required**: Any recent version of Docker
- **Recommended**: Docker Desktop 4.x+
- **Also tested with**: Docker Engine 24+

### Redis

- **Required**: Redis 6.0+ (via Docker)
- **Recommended**: Redis 7.0+
- **Default configuration**: Running in ephemeral mode (data clears on container restart)
- **Port**: 6379 (default)
- **Notes**: The application uses Redis for caching and session management; all backend operations depend on Redis being available

### Django & Django REST Framework

- **Django**: 5.0+
- **Django REST Framework**: 3.14+

If you encounter version-related issues, consider:

1. Updating to the recommended versions listed above
2. Checking package-lock.json or requirements.txt for specific dependency version constraints
3. Reviewing the error logs for incompatibility messages
4. Using a version manager like nvm (for Node.js) or pyenv (for Python) to maintain multiple versions
