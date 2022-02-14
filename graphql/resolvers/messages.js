const { UserInputError, AuthenticationError } = require("apollo-server");
const { Op } = require("sequelize");

const { Message, User } = require("../../models");
const { PubSub, withFilter } = require("graphql-subscriptions");

const pubsub = new PubSub();

let userDetail;

module.exports = {
  Query: {
    getMessages: async (parent, { from }, { user }) => {
      try {
        if (!user) throw new AuthenticationError("Unauthenticated");

        const otherUser = await User.findOne({
          where: { username: from },
        });
        if (!otherUser) throw new UserInputError("User not found");

        const usernames = [user.username, otherUser.username];

        const messages = await Message.findAll({
          where: {
            from: { [Op.in]: usernames },
            to: { [Op.in]: usernames },
          },
          order: [["createdAt", "DESC"]],
        });

        return messages;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Mutation: {
    sendMessage: async (parent, { to, content }, { user }) => {
      try {
        if (!user) throw new AuthenticationError("Unauthenticated");
        userDetail = user;
        const recipient = await User.findOne({ where: { username: to } });

        if (!recipient) {
          throw new UserInputError("User not found");
        } else if (recipient.username === user.username) {
          throw new UserInputError("You cant message yourself");
        }

        if (content.trim() === "") {
          throw new UserInputError("Message is empty");
        }

        const message = await Message.create({
          from: user.username,
          to,
          content,
        });

        pubsub.publish("NEW_MESSAGE", { newMessage: message });
        return message;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Subscription: {
    newMessage: {
      subscribe: withFilter(
        (_, __, { user }) => {
          // if (!user) throw new AuthenticationError("Unauthenticated");
          return pubsub.asyncIterator(["NEW_MESSAGE"]);
        },
        ({ newMessage }, _) => {
          if (
            newMessage.from === userDetail?.username ||
            newMessage.to === userDetail?.username
          ) {
            return true;
          }

          return false;
        }
      ),
    },
  },
};
