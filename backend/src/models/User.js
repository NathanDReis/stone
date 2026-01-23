const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model { }

User.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    createdBy: {
        type: DataTypes.INTEGER,
        field: 'created_by'
    },
    updatedBy: {
        type: DataTypes.INTEGER,
        field: 'updated_by'
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    paranoid: true, // soft delete
    timestamps: true,
    underscored: true,
});

module.exports = User;
