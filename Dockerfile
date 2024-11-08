# Use an official Node.js runtime as a parent image
FROM node:lts-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for installing dependencies
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Build the TypeScript code
RUN npm run build

# Set the command to run the transpiled JavaScript file
CMD [ "node", "dist/src/index.js" ]
