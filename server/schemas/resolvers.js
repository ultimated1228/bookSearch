const bcrypt = require('bcrypt');
// import user model
const { User } = require('../models');
// import sign token function from auth
const { signToken, AuthenticationError } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id })
            } throw AuthenticationError;
        }
    },
    Mutation: {
        login: async (parent, { email, password }) => {
            try {
                // Find the user by their email
                const user = await User.findOne({ email });

                if (!user) {
                    throw new Error("Can't find this user");
                }

                // Check if the password is correct
                const correctPw = await user.isCorrectPassword(password);

                if (!correctPw) {
                    throw new Error('Wrong password!');
                }

                // If the login is successful, create a token and return it along with the user data
                const token = signToken(user);

                return { token, user };
            } catch (error) {
                throw new Error(error);
            }
        },

        addUser: async (parent, { username, email, password }) => {
            try {
                // Hash the user's password before storing it
                const hashedPassword = await bcrypt.hash(password, 10);

                // Create the new user
                const user = await User.create({ username, email, password: hashedPassword });

                if (!user) {
                    throw new Error('User creation failed');
                }

                // Generate a token and return it along with the user data
                const token = signToken(user);

                return { token, user };
            } catch (error) {
                throw new Error(error);
            }
        },

        saveBook: async (parent, { saveBook }, context) => {
            if (context.user) {
                try {
                    // Update the user's savedBooks with the new book data
                    const updatedUser = await User.findOneAndUpdate(
                        { _id: context.user._id },
                        { $addToSet: { savedBooks: saveBook } },
                        { new: true, runValidators: true }
                    );

                    return updatedUser;
                } catch (error) {
                    throw new Error(error.message);
                }
            } else {
                throw new AuthenticationError('You must be logged in to save a book.');
            }
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                try {
                    // Remove the book with the specified bookId from the user's savedBooks
                    const updatedUser = await User.findOneAndUpdate(
                        { _id: context.user._id },
                        { $pull: { savedBooks: { bookId } } },
                        { new: true }
                    );

                    if (!updatedUser) {
                        throw new Error("Couldn't find user with this id.");
                    }

                    return updatedUser;
                } catch (error) {
                    throw new Error(error.message);
                }
            } else {
                throw new AuthenticationError('You must be logged in to remove a book.');
            }
        },
    },
};

module.exports = resolvers