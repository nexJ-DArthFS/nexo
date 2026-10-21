
const express = require('express');
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');

const app = express();

app.use(express.json());

const uri = 'mongodb+srv://juanfalconess_db_user:<db_password>@cluster0.oxahpqw.mongodb.net/?appName=Cluster0';

mongoose.connect(uri)
    .then(() => console.log('Conectado a MongoDB'))
    .catch((error) => console.log('Error de conexión:', error.message));

app.get('/', (req, res) => {
    res.send('Backend de NEXORA funcionando');
});

app.listen(3000, () => {
    console.log('Servidor ejecutándose en el puerto 3000');
});
