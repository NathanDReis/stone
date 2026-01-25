const axios = require('axios');

const api = {
    getUsers: async () => {
        try {
            const response = await fetch('http://localhost:3001/users');
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    },

    createUser: async (data) => {
        try {
            const response = await fetch('http://localhost:3001/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating user:', error);
        }
    }
};

module.exports = api;
