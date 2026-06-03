FROM node:lts-bullseye

RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y ffmpeg webp imagemagick

WORKDIR /app

COPY package*.json./
RUN npm install --legacy-peer-deps

COPY..

EXPOSE 3000
CMD ["npm", "start"]