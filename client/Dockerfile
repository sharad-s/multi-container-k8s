#Specify a base image
FROM node:alpine as builder
#Set WORKDIR
WORKDIR /app
#COPY package.json for dependenceis
COPY ./package.json .
# Install some dependencies
RUN npm install
#COPY the rest of the files over
COPY . .
#Run default build command
RUN npm run build
#builds into /app/build


# Nginx Phase
FROM nginx
#Expose Port 80 for AWS Beanstalk
EXPOSE 3000
#Copy output from build phase to nginx phase
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html    

