import swaggerJSDoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "E-Commerce APIs",
            version: "1.0.0",
            description: "Backend API documentation for ecommerce app",
        },
        servers: [
            {
                url: "http://localhost:5000",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },

    apis: ["./Routes/*.js", "./Controllers/*.js"], 
};

export const swaggerSpec = swaggerJSDoc(options);