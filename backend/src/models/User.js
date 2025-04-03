const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [6, 100]
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'recruiter', 'candidate'),
        allowNull: false,
        defaultValue: 'candidate'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'banned'),
        defaultValue: 'active'
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50]
        }
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50]
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
        }
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: true,
            isBefore: new Date().toISOString()
        }
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
    },
    // Recruiter specific fields
    companyName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    companyPosition: {
        type: DataTypes.STRING,
        allowNull: true
    },
    companySize: {
        type: DataTypes.STRING,
        allowNull: true
    },
    industry: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Candidate specific fields
    skills: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    experience: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    education: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    resumeUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Common fields
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to check password
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User; 