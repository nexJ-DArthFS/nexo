
const mongoose = require('mongoose');

const usuarioEsquema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    rol: {
        type: String,
        default: 'usuario'
    },
    puntos: {
        type: Number,
        default: 0
    },
    activo: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Usuario', usuarioEsquema);
