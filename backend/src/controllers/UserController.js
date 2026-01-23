const UserService = require('../services/UserService');

class UserController {
    async index(req, res) {
        const users = await UserService.getAll();
        return res.json(users);
    }

    async show(req, res) {
        const { id } = req.params;
        const user = await UserService.getById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
    }

    async store(req, res) {
        // Audit user ID (mocking it as 1 for now)
        const userId = 1;
        const user = await UserService.create(req.body, userId);
        return res.status(201).json(user);
    }

    async update(req, res) {
        const { id } = req.params;
        const userId = 1; // mock audit user
        const user = await UserService.update(id, req.body, userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
    }

    async destroy(req, res) {
        const { id } = req.params;
        const user = await UserService.delete(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.status(204).send();
    }
}

module.exports = new UserController();
