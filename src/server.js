require('dotenv').config({ quiet: true });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

start();
