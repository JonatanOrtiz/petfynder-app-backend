const path = require("path");
require("dotenv").config({ path: path.join(__dirname, './.env') });
const express = require('express')
const mongoose = require('mongoose')
const cors = require("cors");
const routes = require('./src/routes')
const app = express()
const admin = require("firebase-admin");
const { mongo } = require("./mongo.json");
const serviceAccount = require("./petfynder-firebase-adminsdk-v2wpf-d0a2b0f3e7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://petfynder.firebaseio.com"
});

mongoose.connect(mongo, {
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
}).then(() => {
  console.log('mongo conectado');
}).catch((err) => {
  console.log('Erro de conexão')
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'PetfynderFrontEnd', 'build')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(routes)
app.use("/files", express.static(path.resolve(__dirname, "..", "tmp", "uploads")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "PetfynderFrontEnd/build", "index.html"))
})

app.listen(5000)
