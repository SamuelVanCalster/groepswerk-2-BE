import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "De vraag van de dag API",
      version: "1.0.0",
      description: "API documentatie voor de vraag van de dag",
    },
    servers: [
      {
        url: "http://localhost:1234",
        description: "Local server",
      },
    ],
  },
  apis: ["./server.js"],
};

const swaggerSpec = swaggerJSDoc(options);

// module.exports = swaggerSpec;

export default swaggerSpec;
