FROM amazonlinux

WORKDIR /app

COPY package*.json ./

RUN yum -y install nodejs

RUN npm install

COPY . .

ENV PORT=8000

EXPOSE 8000

CMD ["npm", "start"]