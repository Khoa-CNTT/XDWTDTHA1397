const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Job = require('./Job');

const Application = sequelize.define('Application', {
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
    jobId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Jobs',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'),
        defaultValue: 'PENDING'
    },
    coverLetter: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    cvUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    recruiterNotes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    interviewDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
});

// Associations
Application.belongsTo(User, { as: 'applicant', foreignKey: 'userId' });
Application.belongsTo(Job, { as: 'job', foreignKey: 'jobId' });

module.exports = Application; 