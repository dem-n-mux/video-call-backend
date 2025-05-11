module.exports = {
    //Port
    PORT: process.env.PORT || 5000,

    //Gmail credentials for send email
    EMAIL: "",
    PASSWORD: "",

    //Secret key for jwt
    JWT_SECRET: "shared_jwt_secret",

    //Project Name
    projectName : "Babble",

    //Base URL
    baseURL: "http://localhost:5000/",

    //Secret key for API
    secretKey: "shared_secret_key",

    //Mongodb string
    MONGODB_CONNECTION_STRING: "mongodb+srv://root:root@cluster0.5d7sw.mongodb.net/flirtzy"
};