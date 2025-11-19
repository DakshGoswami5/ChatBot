const express = require("express");

const app = express();

app.get("/",(req,res)=>{
    res.send("HellO World!");
});

module.exports = app;