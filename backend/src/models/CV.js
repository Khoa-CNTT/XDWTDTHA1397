const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const CV = sequelize.define('CV', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    education: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    experience: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    skills: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    languages: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    certificates: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    projects: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pdfUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

// Associations
CV.belongsTo(User, { as: 'user', foreignKey: 'userId' });

module.exports = CV; 