const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Load env vars
dotenv.config();

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync database (create tables if they don't exist)
        await sequelize.sync();
        console.log('Database synchronized.');

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
};

startServer(); 