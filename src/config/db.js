const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
  }

  try {
    await mongoose.connect(uri);
    // Sin opciones obsoletas
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Error conectando a MongoDB:', err);
    throw err;
  }
};

module.exports = connectDB;