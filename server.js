const express = require("express");

const app = express();

app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515384597133660303/zskDPHYYGhnKF1rUngtG88IrejZwqaslw06TrQwuxuaksuJzXlQD2AuZhOyCqbL8fc-J";

app.get("/", (req, res) => {
    res.send("Activity system online");
});

app.post("/activity", async (req, res) => {
    const { username, userId, playtime, pd } = req.body;

    console.log("Activity received:", req.body);

    try {
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
Playtime: ${playtime} seconds
PDCount: ${pd}`
            })
        });

        res.json({
            success: true,
            message: "Sent to Discord"
        });

    } catch (err) {
        console.error("Webhook error:", err);

        res.status(500).json({
            success: false,
            message: "Failed to send webhook"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
