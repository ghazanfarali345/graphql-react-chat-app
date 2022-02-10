const jwt = require("jsonwebtoken");

module.exports = (context) => {
  console.log(
    context.req.headers.authorization,
    "context.req.headers.authorization"
  );
  if (context.req && context.req.headers.authorization) {
    const token = context.req.headers.authorization.split("Bearer ")[1];
    jwt.verify(token, "secret", (err, decodedToken) => {
      context.user = decodedToken;
    });
  }

  return context;
};
