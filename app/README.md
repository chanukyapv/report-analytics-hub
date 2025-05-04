
# QLA1 Dashboard Backend

This folder contains the backend code for the QLA1 Dashboard application.

## Tech Stack

- FastAPI - Web framework
- Ariadne - GraphQL implementation
- MongoDB - Database
- Python 3.9+ - Programming language

## Setup

1. Create a virtual environment
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment
   ```bash
   # On Windows
   .\venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your MongoDB credentials and other settings
   ```

5. Start the server
   ```bash
   uvicorn app.main:app --reload
   ```

The GraphQL API will be available at http://localhost:8000/graphql
