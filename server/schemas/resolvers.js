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
        },
    },
    Mutation: {
        login: async (parent, { email, password }) => {
            const profile = await User.findOne({ email });

            if (!profile) {
                throw AuthenticationError;
            }

            const correctPw = await profile.isCorrectPassword(password);

            if (!correctPw) {
                throw AuthenticationError;
            }

            const token = signToken(profile);
            return { token, profile };
        },

        addUser: async (parent, { username, email, password }) => {
            try {
                const user = await User.create({ username, email, password })
                const token = signToken(user);
            

                if (!user) {
                    throw new Error('User creation failed');
                }

                return { token, user };
            } catch (error) {
                throw new Error(error);
            }
        },

        saveBook: async (parent, { saveBook }, context) => {
            if (context.user) {
                return User.findOneAndUpdate(
                        { _id: context.user._id },
                        { $addToSet: { savedBooks: saveBook } },
                        { new: true, runValidators: true }
                    );              
            } 
                throw AuthenticationError('You must be logged in to save a book.');
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