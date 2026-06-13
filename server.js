const express = require("express");

const app = express();

app.use(express.json());

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

app.get("/", (req, res) => {
    res.send("Activity system online");
});

app.post("/activity", async (req, res) => {
    const { username, userId, playtime, pd } = req.body;

    console.log(req.body);

    try {
        if (DISCORD_WEBHOOK) {
            await fetch(DISCORD_WEBHOOK, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content:
`🟢 Activity Received

Username: ${username}
UserId: ${userId}
Playtime: ${playtime}
PDCount: ${pd}`
                })
            });
        }

        res.json({
            success: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
