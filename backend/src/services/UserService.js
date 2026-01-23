const User = require('../models/User');

class UserService {
    async getAll() {
        return await User.findAll();
    }

    async getById(id) {
        return await User.findByPk(id);
    }

    async create(data, userId) {
        return await User.create({ ...data, createdBy: userId });
    }

    async update(id, data, userId) {
        const user = await User.findByPk(id);
        if (!user) return null;
        return await user.update({ ...data, updatedBy: userId });
    }

    async delete(id) {
        const user = await User.findByPk(id);
        if (!user) return null;
        return await user.destroy();
    }
}

module.exports = new UserService();
