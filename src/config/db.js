const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida. Revisa tu archivo .env');
  }

  try {
    await mongoose.connect(uri);
    console.log(
      `MongoDB conectado: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
    return mongoose.connection;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    throw error;
  }
}

module.exports = connectDB;
