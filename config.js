module.exports = {
    //Port
    PORT: process.env.PORT || 5000,

    //Gmail credentials for send email
    EMAIL: "kodebookapp@gmail.com",
    PASSWORD: "nohwrpybgiuhqjfy",

    //Secret key for jwt
    JWT_SECRET: "shared_jwt_secret",

    //Project Name
    projectName : "$app_name",

    //baseURL
    baseURL: "http://flirtzybackend.centralindia.cloudapp.azure.com:5000/",     // http://localhost:5000/

    //Secret key for API
    secretKey: "shared_secret_key",

    //Mongodb string
    MONGODB_CONNECTION_STRING: "mongodb+srv://root:root@cluster0.5d7sw.mongodb.net/flirtzy"
};