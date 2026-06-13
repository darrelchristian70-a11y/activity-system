const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Activity system online");
});

app.post("/activity", (req, res) => {
    console.log(req.body);

    res.json({
        success: true
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
