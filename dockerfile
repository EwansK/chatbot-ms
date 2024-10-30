# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json, then install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire chatbot application code into the container
COPY . .

# Expose the port your chatbot server is running on (update if different)
EXPOSE 3002

# Set environment variables if needed (or use --env-file at runtime)
ENV NODE_ENV=production

# Command to start the chatbot server
CMD ["node", "index.js"]
