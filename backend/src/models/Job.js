const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const JobCategory = require('./JobCategory');

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    requirements: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    salary: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    employmentType: {
        type: DataTypes.ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'),
        allowNull: false
    },
    experienceLevel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    skills: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('skills');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('skills', JSON.stringify(value || []));
        }
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'CLOSED', 'DRAFT'),
        defaultValue: 'ACTIVE'
    },
    recruiterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'JobCategories',
            key: 'id'
        }
    }
}, {
    timestamps: true
});

// Associations
Job.belongsTo(User, { as: 'recruiter', foreignKey: 'recruiterId' });
Job.belongsTo(JobCategory, { as: 'category', foreignKey: 'categoryId' });

module.exports = Job; 