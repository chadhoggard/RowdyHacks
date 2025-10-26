# 1. Start with the correct Python base image
FROM python:3.11-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Install system dependencies
#    `build-essential` is kept as it can be useful for
#    compiling other dependencies if needed.
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy *only* the requirements file first
#    This leverages Docker's build cache. If this file doesn't change,
#    Docker won't re-install all the dependencies every time.
#    (Assuming requirements.txt is in the root of your backend folder)
COPY requirements.txt .

# 5. Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the *entire* rest of your backend code
#    This is the KEY fix. It copies the `app/` directory and any
#    other files into the container, preserving the file structure.
COPY . .

# 7. Expose the port your server listens on (from setup_local.sh)
EXPOSE 8080

# 8. Define the command to run your app
#    This also comes from your `setup_local.sh` script.
#    I removed `--reload` because it's only for development, not production.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]