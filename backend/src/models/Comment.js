const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Blog = require('./Blog');

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    blogId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Blogs',
            key: 'id'
        }
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Comments',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'HIDDEN', 'DELETED'),
        defaultValue: 'ACTIVE'
    }
}, {
    timestamps: true
});

// Associations
Comment.belongsTo(User, { as: 'author', foreignKey: 'userId' });
Comment.belongsTo(Blog, { as: 'blog', foreignKey: 'blogId' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });

module.exports = Comment; 