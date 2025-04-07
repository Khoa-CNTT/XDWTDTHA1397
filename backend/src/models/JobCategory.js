const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JobCategory = sequelize.define('JobCategory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'JobCategories',
            key: 'id'
        }
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalJobs: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    metaTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metaDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    keywords: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    }
}, {
    hooks: {
        beforeCreate: (category) => {
            if (!category.slug) {
                category.slug = category.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            }
        },
        beforeUpdate: (category) => {
            if (category.changed('name') && !category.changed('slug')) {
                category.slug = category.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            }
        }
    }
});

// Self-referential relationship for hierarchical categories
JobCategory.belongsTo(JobCategory, { as: 'parent', foreignKey: 'parentId' });
JobCategory.hasMany(JobCategory, { as: 'children', foreignKey: 'parentId' });

module.exports = JobCategory; 