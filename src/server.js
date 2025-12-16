const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/user.model');

const PORT = process.env.PORT || 3000;

// Función para limpiar usuarios no verificados antiguos
const cleanupUnverifiedUsers = async () => {
  try {
    const expiryDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 horas
    const result = await User.deleteMany({
      isConfirmed: false,
      createdAt: { $lt: expiryDate }
    });
    if (result.deletedCount > 0) {
      console.log(`Limpieza: ${result.deletedCount} usuario(s) no verificado(s) eliminado(s)`);
    }
  } catch (error) {
    console.error('Error en limpieza de usuarios no verificados:', error);
  }
};

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Ejecutar limpieza inicial al arrancar
      cleanupUnverifiedUsers();
      
      // Ejecutar limpieza cada 6 horas
      setInterval(cleanupUnverifiedUsers, 6 * 60 * 60 * 1000);
      console.log('Sistema de limpieza de usuarios no verificados activado (cada 6 horas)');
    });
  })
  .catch((err) => {
    console.error('No se pudo iniciar el servidor:', err);
    process.exit(1);
  });