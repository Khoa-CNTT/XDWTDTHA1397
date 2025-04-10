const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Job = require('./Job');

const SavedJob = sequelize.define('SavedJob', {
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
    }
}, {
    timestamps: true
});

// Associations
SavedJob.belongsTo(User, { as: 'user', foreignKey: 'userId' });
SavedJob.belongsTo(Job, { as: 'job', foreignKey: 'jobId' });

module.exports = SavedJob; 